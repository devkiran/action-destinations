import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track a lead',
  description: 'Track a lead for a short link.',
  defaultSubscription: 'type = "track"',
  fields: {
    clickId: {
      label: 'Click ID',
      description: 'The ID of the click in Dub. You can read this value from "dub_id" cookie.',
      type: 'string',
      required: true
    },
    eventName: {
      label: 'Event Name',
      description: 'The name of the lead event to track.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    externalId: {
      label: 'External ID',
      description:
        "This is the unique identifier for the customer in the your app. This is used to track the customer's journey.",
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    eventQuantity: {
      label: 'Event Quantity',
      description: 'The quantity of the lead event to track.',
      type: 'number',
      required: false
    },
    customerName: {
      label: 'Customer Name',
      description: 'The name of the customer.',
      type: 'string',
      required: false
    },
    customerEmail: {
      label: 'Customer Email',
      description: 'The email of the customer.',
      type: 'string',
      format: 'email',
      required: false,
      default: {
        '@path': '$.email'
      }
    },
    customerAvatar: {
      label: 'Customer Avatar',
      description: 'The avatar of the customer.',
      type: 'string',
      required: false
    },
    metadata: {
      label: 'Metadata',
      description: 'Additional metadata to be stored with the lead event.',
      type: 'object',
      required: false
    }
  },
  perform: (request, { payload }) => {
    return request(`${API_URL}/track/lead`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },
  performBatch: async (request, { payload }) => {
    return await Promise.all(
      payload.map(async (event) =>
        request(`${API_URL}/track/lead`, {
          method: 'POST',
          body: JSON.stringify(event)
        })
      )
    )
  }
}

export default action
