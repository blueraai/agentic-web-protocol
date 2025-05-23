import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { load, dump } from 'js-yaml'

import * as lib from './lib'

import awp, { UniversalTool } from './index'

const { parseHtml, parseApi } = awp

// Mock fetch for API tests
const mockFetch = jest.fn().mockImplementation((args: any, init?: any) => {
  const format = init?.headers?.['Accept'] === 'application/yaml' ? 'YAML' : 'JSON'
  if (format === 'YAML') {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(`
        elements:
          - selector: <api-selector>
            description: API endpoint
            available_interactions:
              - type: get
                description: get data
      `)
    } as Response)
  } else {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        elements: [{
          selector: '<api-selector>',
          description: 'API endpoint',
          available_interactions: [{
            type: 'get',
            description: 'get data'
          }]
        }]
      })
    } as Response)
  }
})
global.fetch = mockFetch as any as typeof fetch

// Remove the lib module mock since we want to use the actual implementation
jest.unmock('./lib')

describe('parseHtml', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('parse_html_yaml', async () => {
    console.log('\nTest: parse_html_yaml')
    console.log('='.repeat(50))
    console.log('\nInput HTML:')
    console.log('-'.repeat(50))

    const html = `
      <html ai-description="Travel site to book flights and trains">
        <body>
          <form class="form-booking-flight" ai-description="Form to book a flight">
            <h1 ai-description="Form description">
              Book a flight
            </h1>
            <label ai-description="Form query">
              Where to?
            </label>
            <input
              ai-ref="<input-ai-ref>"
              ai-description="Form input where to enter the destination"
              ai-interactions="input: enables the form confirmation button, given certain constraints;"
              type="text"
              id="destination"
              name="destination"
              required
              size="10"
              minlength="3"
              maxlength="30" />
            <div>
              <button
                ai-description="Confirmation button to proceed with booking a flight"
                ai-interactions="click: proceed; hover: diplay additonal information about possible flights;"
                ai-prerequisite-click="<input-ai-ref>: input destination;"
                ai-next-click="list of available flights; book a flight; login;"
                disabled>
                See available flights
              </button>
              <button
                ai-description="Cancel button to get back to the home page"
                ai-interactions="click: dismiss form and return to home page;"
                ai-next-click="access forms to book trains; access forms to book flights;">
                Back
              </button>
            </div>
          </form>
        </body>
      </html>
    `
    console.log(html)

    const result = await parseHtml({ html, format: "YAML" })
    const parsed = load(result) as any

    console.log('\nOutput YAML:')
    console.log('-'.repeat(50))
    console.log(dump(parsed))

    // Test basic structure
    expect(parsed).toHaveProperty('elements')
    expect(parsed.elements).toHaveLength(1)

    // Test HTML element
    const htmlElem = parsed.elements[0]
    expect(htmlElem.description).toBe("Travel site to book flights and trains")
    expect(htmlElem).toHaveProperty('contains')
    expect(htmlElem.selector).toBeTruthy()

    // Test form element
    const formElem = htmlElem.contains[0]
    expect(formElem.description).toBe("Form to book a flight")
    expect(formElem).toHaveProperty('contains')
    expect(formElem.selector).toBeTruthy()

    // Test h1 element
    const h1Elem = formElem.contains[0]
    expect(h1Elem.description).toBe("Form description")
    expect(h1Elem.content).toBe("Book a flight")
    expect(h1Elem.selector).toBeTruthy()

    // Test label element
    const labelElem = formElem.contains[1]
    expect(labelElem.description).toBe("Form query")
    expect(labelElem.content).toBe("Where to?")
    expect(labelElem.selector).toBeTruthy()

    // Test input element
    const inputElem = formElem.contains[2]
    expect(inputElem.description).toBe("Form input where to enter the destination")
    expect(inputElem).toHaveProperty('parameters')
    expect(inputElem.parameters.type).toBe('text')
    expect(inputElem.parameters.name).toBe('destination')
    expect(inputElem.parameters.required).toBe(true)
    // Verify numeric parameters are actual numbers
    expect(inputElem.parameters.minlength).toBe(3)
    expect(inputElem.parameters.maxlength).toBe(30)
    expect(inputElem.selector).toBeTruthy()

    // Test input interactions
    expect(inputElem).toHaveProperty('available_interactions')
    const inputInteraction = inputElem.available_interactions[0]
    expect(inputInteraction.type).toBe('input')
    expect(inputInteraction.description).toBe('enables the form confirmation button, given certain constraints')

    // Test button elements
    const confirmButton = formElem.contains[3]
    expect(confirmButton.description).toBe("Confirmation button to proceed with booking a flight")
    expect(confirmButton.content).toBe("See available flights")
    expect(confirmButton.selector).toBeTruthy()

    // Test confirm button interactions
    expect(confirmButton).toHaveProperty('available_interactions')
    const clickInteraction = confirmButton.available_interactions[0]
    expect(clickInteraction.type).toBe('click')
    expect(clickInteraction.description).toBe('proceed')
    expect(clickInteraction).toHaveProperty('prerequisites')
    expect(clickInteraction).toHaveProperty('next_features')

    // Test prerequisites
    const prereq = clickInteraction.prerequisites[0]
    expect(prereq.selector).toBeTruthy()
    expect(prereq.interaction).toBe('input destination')

    // Test next features
    expect(clickInteraction.next_features).toContain('list of available flights')
    expect(clickInteraction.next_features).toContain('book a flight')
    expect(clickInteraction.next_features).toContain('login')

    // Test hover interaction
    const hoverInteraction = confirmButton.available_interactions[1]
    expect(hoverInteraction.type).toBe('hover')
    expect(hoverInteraction.description).toBe('diplay additonal information about possible flights')

    // Test cancel button
    const cancelButton = formElem.contains[4]
    expect(cancelButton.description).toBe("Cancel button to get back to the home page")
    expect(cancelButton.content).toBe("Back")
    expect(cancelButton.selector).toBeTruthy()

    // Test cancel button interactions
    const cancelInteraction = cancelButton.available_interactions[0]
    expect(cancelInteraction.type).toBe('click')
    expect(cancelInteraction.description).toBe('dismiss form and return to home page')
    expect(cancelInteraction).toHaveProperty('next_features')
    expect(cancelInteraction.next_features).toContain('access forms to book trains')
    expect(cancelInteraction.next_features).toContain('access forms to book flights')

    console.log('\n✓ Test passed successfully')
  })

  test('parse_html_json', async () => {
    console.log('\nTest: parse_html_json')
    console.log('='.repeat(50))
    console.log('\nInput HTML:')
    console.log('-'.repeat(50))

    const html = `
      <div ai-description="Test element">
        <input type="text" required minlength="5" maxlength="20" />
      </div>
    `
    console.log(html)

    const result = await parseHtml({ html, format: "JSON" })
    const parsed = JSON.parse(result)

    console.log('\nOutput JSON:')
    console.log('-'.repeat(50))
    console.log(JSON.stringify(parsed, null, 2))

    // Test basic structure
    expect(parsed).toHaveProperty('elements')
    expect(parsed.elements).toHaveLength(1)

    // Test div element
    const divElem = parsed.elements[0]
    expect(divElem).toHaveProperty('description', "Test element")
    expect(divElem.selector).toBeTruthy()
    // Since the input has no ai- attributes, it should not be included
    expect(divElem).not.toHaveProperty('contains')

    console.log('\n✓ Test passed successfully')
  })
})

describe('parseApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('parse_api_yaml', async () => {
    console.log('\nTest: parse_api_yaml')
    console.log('='.repeat(50))

    const mockResponse = `
      elements:
        - selector: <api-selector>
          description: API endpoint
          available_interactions:
            - type: get
              description: get data
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockResponse)
    } as never)

    const result = await parseApi({ url: "http://example.com", format: "YAML" })
    const parsed = load(result) as any

    // Test basic structure
    expect(parsed).toHaveProperty('elements')
    expect(parsed.elements).toHaveLength(1)

    // Test API element
    const apiElem = parsed.elements[0]
    expect(apiElem.description).toBe("API endpoint")
    expect(apiElem.selector).toBeTruthy()

    // Test interactions
    expect(apiElem).toHaveProperty('available_interactions')
    const interaction = apiElem.available_interactions[0]
    expect(interaction.type).toBe('get')
    expect(interaction.description).toBe('get data')

    console.log('\n✓ Test passed successfully')
  })

  test('parse_api_json', async () => {
    console.log('\nTest: parse_api_json')
    console.log('='.repeat(50))

    const mockResponse = {
      elements: [{
        selector: '<api-selector>',
        description: 'API endpoint',
        available_interactions: [{
          type: 'get',
          description: 'get data'
        }]
      }]
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as never)

    const result = await parseApi({ url: "http://example.com", format: "JSON" })

    // Test basic structure
    expect(result).toHaveProperty('elements')
    expect(result.elements).toHaveLength(1)

    // Test API element
    const apiElem = result.elements[0]
    expect(apiElem.description).toBe("API endpoint")
    expect(apiElem.selector).toBeTruthy()

    // Test interactions
    expect(apiElem).toHaveProperty('available_interactions')
    const interaction = apiElem.available_interactions[0]
    expect(interaction.type).toBe('get')
    expect(interaction.description).toBe('get data')

    console.log('\n✓ Test passed successfully')
  })

  test('parse_api_authorization', async () => {
    console.log('\nTest: parse_api_authorization')
    console.log('='.repeat(50))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('elements: []')
    } as never)

    await parseApi({ url: "http://example.com", authorization: "Bearer token" })

    // Verify authorization header was set
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const call = mockFetch.mock.calls[0]
    const init = call[1] as RequestInit
    if (init?.headers) {
      const headers = init.headers as { Authorization: string }
      expect(headers.Authorization).toBe("Bearer token")
    } else {
      throw new Error('Mock fetch was not called with expected arguments')
    }

    console.log('\n✓ Test passed successfully')
  })

  test('parse_api_url_handling', async () => {
    console.log('\nTest: parse_api_url_handling')
    console.log('='.repeat(50))

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('elements: []')
    } as never)

    // Test URL without /ai-handshake
    await parseApi({ url: "http://example.com" })
    expect(global.fetch).toHaveBeenCalledWith(
      "http://example.com/ai-handshake",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Object)
      })
    )

    // Test URL with /ai-handshake
    await parseApi({ url: "http://example.com/ai-handshake" })
    expect(global.fetch).toHaveBeenCalledWith(
      "http://example.com/ai-handshake",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Object)
      })
    )

    console.log('\n✓ Test passed successfully')
  })
})

describe('UniversalTool', () => {
  let tool: UniversalTool

  beforeEach(() => {
    tool = new UniversalTool()
    jest.clearAllMocks()
  })

  test('contract', () => {
    console.log('\nTest: UniversalTool contract')
    console.log('='.repeat(50))

    const contract = tool.contract()

    // Test basic contract structure
    expect(contract.name).toBe('AWP Tool')
    expect(contract.description).toBe('A tool to parse AWP compliant HTML and API endpoints')
    expect(contract.methods).toBeDefined()

    // Test methods
    const methodNames = contract.methods.map(m => m.name)
    expect(methodNames).toContain('parseApi')
    expect(methodNames).toContain('parseHtml')
    expect(methodNames).toContain('contract')
    expect(methodNames).toContain('requirements')

    // Test parseApi method specification
    const parseApiMethod = contract.methods.find(m => m.name === 'parseApi')
    expect(parseApiMethod?.description).toBe('Parse an AWP compliant API endpoint')
    expect(parseApiMethod?.arguments).toBeDefined()
    expect(parseApiMethod?.outputs).toBeDefined()

    // Test parseHtml method specification
    const parseHtmlMethod = contract.methods.find(m => m.name === 'parseHtml')
    expect(parseHtmlMethod?.description).toBe('Parse an AWP compliant HTML page')
    expect(parseHtmlMethod?.arguments).toBeDefined()
    expect(parseHtmlMethod?.outputs).toBeDefined()

    console.log('\n✓ Test passed successfully')
  })

  test('requirements', () => {
    console.log('\nTest: UniversalTool requirements')
    console.log('='.repeat(50))

    const requirements = tool.requirements()
    expect(requirements).toEqual([])

    console.log('\n✓ Test passed successfully')
  })

  test('parseApi', async () => {
    console.log('\nTest: UniversalTool parseApi')
    console.log('='.repeat(50))

    const mockResult = 'test result'
    const mockLog = { success: true }

    jest.spyOn(lib, 'parseApi').mockResolvedValueOnce(mockResult)

    const [result, log] = await tool.parseApi({ url: 'http://example.com' })

    expect(lib.parseApi).toHaveBeenCalledWith({ url: 'http://example.com' })
    expect(result).toEqual(mockResult)
    expect(log).toEqual({ success: true })

    console.log('\n✓ Test passed successfully')
  })

  test('parseHtml', async () => {
    console.log('\nTest: UniversalTool parseHtml')
    console.log('='.repeat(50))

    const mockResult = 'test result'
    const mockLog = { success: true }

    jest.spyOn(lib, 'parseHtml').mockResolvedValueOnce(mockResult)

    const [result, log] = await tool.parseHtml({ html: '<div>test</div>' })

    expect(lib.parseHtml).toHaveBeenCalledWith({ html: '<div>test</div>' })
    expect(result).toEqual(mockResult)
    expect(log).toEqual({ success: true })

    console.log('\n✓ Test passed successfully')
  })
})
