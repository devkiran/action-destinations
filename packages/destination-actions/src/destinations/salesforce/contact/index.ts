import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  bulkUpsertExternalId,
  bulkUpdateRecordId,
  customFields,
  operation,
  traits,
  validateLookup,
  enable_batching,
  recordMatcherOperator,
  batch_size,
  hideIfDeleteOperation
} from '../sf-properties'
import Salesforce, { generateSalesforceRequest } from '../sf-operations'

const OBJECT_NAME = 'Contact'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Contact',
  description: 'Create, update, or upsert contacts in Salesforce.',
  fields: {
    operation: operation,
    recordMatcherOperator: recordMatcherOperator,
    enable_batching: enable_batching,
    batch_size: batch_size,
    traits: traits,
    bulkUpsertExternalId: bulkUpsertExternalId,
    bulkUpdateRecordId: bulkUpdateRecordId,
    last_name: {
      label: 'Last Name',
      description: "The contact's last name up to 80 characters. **This is required to create a contact.**",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    first_name: {
      label: 'First Name',
      description: "The contact's first name up to 40 characters.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    account_id: {
      label: 'Account ID',
      description:
        'The ID of the account that this contact is associated with. This is the Salesforce-generated ID assigned to the account during creation (i.e. 0018c00002CDThnAAH).',
      type: 'string',
      depends_on: hideIfDeleteOperation
    },
    email: {
      label: 'Email',
      description: "The contact's email address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    mailing_city: {
      label: 'Mailing City',
      description: "City for the contact's mailing address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.properties.address.city' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    mailing_postal_code: {
      label: 'Mailing Postal Code',
      description: "Postal Code for the contact's mailing address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.properties.address.postal_code' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    mailing_country: {
      label: 'Mailing Country',
      description: "Country for the contact's mailing address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.properties.address.country' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    mailing_street: {
      label: 'Mailing Street',
      description: "Street number and name for the contact's mailing address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.street' },
          then: { '@path': '$.traits.address.street' },
          else: { '@path': '$.properties.address.street' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    mailing_state: {
      label: 'Mailing State',
      description: "State for the contact's mailing address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.properties.address.state' }
        }
      },
      depends_on: hideIfDeleteOperation
    },
    customFields: customFields
  },
  perform: async (request, { settings, payload }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (payload.operation === 'create') {
      if (!payload.last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
      return await sf.createRecord(payload, OBJECT_NAME)
    }

    validateLookup(payload)

    if (payload.operation === 'update') {
      return await sf.updateRecord(payload, OBJECT_NAME)
    }

    if (payload.operation === 'upsert') {
      if (!payload.last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
      return await sf.upsertRecord(payload, OBJECT_NAME)
    }

    if (payload.operation === 'delete') {
      return await sf.deleteRecord(payload, OBJECT_NAME)
    }
  },
  performBatch: async (request, { settings, payload, features, statsContext, logger }) => {
    const sf: Salesforce = new Salesforce(settings.instanceUrl, await generateSalesforceRequest(settings, request))

    if (payload[0].operation === 'upsert') {
      if (!payload[0].last_name) {
        throw new IntegrationError('Missing last_name value', 'Misconfigured required field', 400)
      }
    }

    let shouldShowAdvancedLogging = false
    if (features && features['salesforce-advanced-logging']) {
      shouldShowAdvancedLogging = true
    }

    return sf.bulkHandler(payload, OBJECT_NAME, { shouldLog: shouldShowAdvancedLogging, stats: statsContext, logger })
  }
}

export default action
