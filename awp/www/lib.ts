import { dump } from 'js-yaml'
import { JSDOM } from 'jsdom'

// Types
interface Element {
  tagName: string;
  attributes: NamedNodeMap;
  textContent?: string;
  children: Element[];
  childNodes: NodeListOf<ChildNode>;
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
  querySelectorAll: (selector: string) => Element[];
  previousElementSibling: Element | null;
  parentElement: Element | null;
}

interface Interaction {
  type: string;
  description: string;
  prerequisites?: Array<{
    selector: string;
    interaction: string;
  }>;
  next_features?: string[];
}

interface ParsedElement {
  selector: string;
  description?: string;
  content?: string;
  parameters?: { [key: string]: any };
  available_interactions?: Interaction[];
  contains?: ParsedElement[];
}

interface ParsedResult {
  elements: ParsedElement[];
}

// Helper function to check if element has any ai- attribute
function hasAiAttribute(element: Element): boolean {
  return Array.from(element.attributes).some(attr => attr.name.startsWith('ai-'))
}

// Helper function to generate unique CSS selector
function generateSelector(element: Element, dom: any): string {
  const selectorParts: string[] = []
  let current: Element | null = element

  while (current) {
    let part = current.tagName.toLowerCase()

    // Add class if present
    const classValue = current.getAttribute('class')
    if (classValue) {
      const classes = classValue.split(' ').filter(c => c.trim())
      if (classes.length > 0) {
        part += '.' + classes.join('.')
      }
    }

    // Add id if present
    const id = current.getAttribute('id')
    if (id) {
      part += `#${id}`
    }

    // Add name for form elements
    const name = current.getAttribute('name')
    if (name) {
      part += `[name='${name}']`
    }

    // Add type for inputs
    if (current.tagName.toLowerCase() === 'input') {
      const type = current.getAttribute('type')
      if (type) {
        part += `[type='${type}']`
      }
    }

    // Add placeholder for inputs and textareas
    if (['input', 'textarea'].includes(current.tagName.toLowerCase())) {
      const placeholder = current.getAttribute('placeholder')
      if (placeholder) {
        part += `[placeholder='${placeholder}']`
      }
    }

    // Add value for inputs
    if (current.tagName.toLowerCase() === 'input') {
      const value = current.getAttribute('value')
      if (value) {
        part += `[value='${value}']`
      }
    }

    // If we still don't have a unique selector, add position
    const selector = selectorParts.concat([part]).join(' ')
    const matches = dom ? dom.window.document.querySelectorAll(selector) : document.querySelectorAll(selector)
    if (matches.length > 1) {
      // Count similar elements before this one
      let similarElements = 0
      let sibling = current.previousElementSibling
      while (sibling) {
        if (sibling.tagName === current.tagName) {
          similarElements++
        }
        sibling = sibling.previousElementSibling
      }
      if (similarElements > 0) {
        part += `:nth-of-type(${similarElements + 1})`
      }
    }

    selectorParts.unshift(part)
    current = current.parentElement
  }

  // Remove [document] prefix if present
  const selector = selectorParts.join(' ')
  return selector.replace(/^\[document\]\s+/, '')
}

// Helper function to get nested text content up to elements with ai- attributes
function getNestedTextContent(element: Element): string | undefined {
  let content = ''
  
  // Process child nodes
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) { // Text node (3 = TEXT_NODE)
      const text = node.textContent?.trim()
      if (text) {
        content += (content ? ' ' : '') + text
      }
    } else if (node.nodeType === 1) { // Element node (1 = ELEMENT_NODE)
      const childElement = node as unknown as Element
      // Stop if child has ai- attributes
      if (hasAiAttribute(childElement)) {
        break
      }
      // Recursively get content from child
      const childContent = getNestedTextContent(childElement)
      if (childContent) {
        content += (content ? ' ' : '') + childContent
      }
    }
  }

  return content.trim() || undefined
}

// Helper function to parse element
function parseElement(element: Element, dom: JSDOM, aiRefMap: { [key: string]: string }): ParsedElement | ParsedElement[] | null {
  const result: ParsedElement = { selector: generateSelector(element, dom) }

  // Store ai-ref to selector mapping if present
  const aiRef = element.getAttribute('ai-ref')
  if (aiRef) {
    aiRefMap[aiRef] = result.selector
  }

  // Get description if present
  const description = element.getAttribute('ai-description')
  if (description) {
    result.description = description
  }

  // Get nested text content if present
  const content = getNestedTextContent(element)
  if (content) {
    result.content = content.replace(/\s+/g, ' ')
  }

  // Parse interactions if present
  const interactionsStr = element.getAttribute('ai-interactions')
  if (interactionsStr) {
    const interactions: Interaction[] = []
    const interactionStrings = interactionsStr.split(';')

    for (const interactionStr of interactionStrings) {
      if (!interactionStr.trim()) continue

      const [type, description] = interactionStr.split(':', 2)
      if (!type || !description) continue

      const interaction: Interaction = {
        type: type.trim(),
        description: description.trim()
      }

      // Parse prerequisites if present
      const prereqKey = `ai-prerequisite-${type.trim()}`
      const prereqValue = element.getAttribute(prereqKey)
      if (prereqValue) {
        const prereqs = prereqValue.split(';')
          .filter(prereq => prereq.trim())
          .map(prereq => {
            const [aiRef, interaction] = prereq.split(':', 2)
            if (!aiRef || !interaction) return null
            return {
              selector: aiRefMap[aiRef] || '',
              interaction: interaction.trim()
            }
          })
          .filter((prereq): prereq is NonNullable<typeof prereq> => prereq !== null)

        if (prereqs.length > 0) {
          interaction.prerequisites = prereqs
        }
      }

      // Parse next features if present
      const nextKey = `ai-next-${type.trim()}`
      const nextValue = element.getAttribute(nextKey)
      if (nextValue) {
        interaction.next_features = nextValue
          .split(';')
          .map(f => f.trim())
          .filter(f => f)
      }

      interactions.push(interaction)
    }

    if (interactions.length > 0) {
      result.available_interactions = interactions
    }
  }

  // Parse parameters for input elements
  if (element.tagName.toLowerCase() === 'input') {
    const params: { [key: string]: any } = {}
    const inputAttrs = [
      'accept', 'alt', 'autocapitalize', 'capture', 'checked',
      'disabled', 'list', 'max', 'maxlength',
      'min', 'minlength', 'multiple', 'name', 'pattern', 'placeholder',
      'readonly', 'required',
      'src', 'step', 'type', 'value'
    ]

    for (const attr of inputAttrs) {
      if (['checked', 'disabled', 'multiple', 'readonly', 'required'].includes(attr)) {
        if (element.hasAttribute(attr)) {
          params[attr] = true
        }
      } else {
        const value = element.getAttribute(attr)
        if (value) {
          if (['max', 'maxlength', 'min', 'minlength', 'step'].includes(attr)) {
            const numValue = parseInt(value, 10)
            params[attr] = isNaN(numValue) ? value : numValue
          } else {
            params[attr] = value
          }
        }
      }
    }

    if (Object.keys(params).length > 0) {
      result.parameters = params
    }
  }

  // Parse parameters for textarea elements
  else if (element.tagName.toLowerCase() === 'textarea') {
    const params: { [key: string]: any } = {}
    const textareaAttrs = ['minlength', 'maxlength', 'readonly', 'required', 'name', 'placeholder']

    for (const attr of textareaAttrs) {
      const value = element.getAttribute(attr)
      if (value) {
        if (attr === 'required') {
          params[attr] = true
        } else if (['minlength', 'maxlength'].includes(attr)) {
          const numValue = parseInt(value, 10)
          params[attr] = isNaN(numValue) ? value : numValue
        } else {
          params[attr] = value
        }
      }
    }

    if (Object.keys(params).length > 0) {
      result.parameters = params
    }
  }

  // Recursively parse child elements
  const children: ParsedElement[] = []
  for (const child of Array.from(element.children)) {
    const childData = parseElement(child, dom, aiRefMap)
    if (childData) {
      if (Array.isArray(childData)) {
        children.push(...childData)
      } else {
        children.push(childData)
      }
    }
  }

  if (children.length > 0) {
    result.contains = children
  }

  // Only return elements that have ai- attributes
  if (hasAiAttribute(element)) {
    return result
  }
  // If element has no ai- attributes but has children with ai- attributes,
  // return just the children
  if (children.length > 0) {
    return children
  }
  return null
}

/** 
 * Parse HTML content and return a structured representation.
 * This function is async to maintain API compatibility and allow for future async operations.
 */
export async function parseHtml({ html, format = "YAML" }: { html: string, format?: string }): Promise<string> {
  let doc: Document
  let dom: any = null
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.document) {
    // Browser environment - use native DOM APIs
    const parser = new DOMParser()
    doc = parser.parseFromString(html, 'text/html')
  } else {
    // Node.js environment - use JSDOM
    const { JSDOM } = await import('jsdom')
    dom = new JSDOM(html)
    doc = dom.window.document
  }

  const aiRefMap: { [key: string]: string } = {}

  // Start parsing from the root element
  const root = doc.documentElement
  if (!root) {
    return format.toUpperCase() === "JSON" ? await Promise.resolve(JSON.stringify({ elements: [] })) : await Promise.resolve(dump({ elements: [] }))
  }

  const parsedElement = parseElement(root as unknown as Element, dom, aiRefMap)
  const elements = Array.isArray(parsedElement) ? parsedElement : [parsedElement]

  const result: ParsedResult = {
    elements: elements.filter((el): el is ParsedElement => el !== null)
  }

  // Convert to requested format
  if (format.toUpperCase() === "JSON") {
    return await Promise.resolve(JSON.stringify(result, null, 2))
  } else {
    return await Promise.resolve(dump(result, { noRefs: true, sortKeys: false }))
  }
}

export async function parseApi({ url, authorization, format = "YAML" }: { url: string, authorization?: string, format?: string }): Promise<any> {
  const headers: { [key: string]: string } = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": format === "YAML" ? "application/yaml" : "application/json",
    "Content-Type": format === "YAML" ? "application/yaml" : "application/json",
  }

  if (authorization) {
    headers["Authorization"] = authorization
  }

  const apiUrl = url.endsWith("/ai-handshake") ? url : `${url}/ai-handshake`

  return fetch(apiUrl, {
    method: "GET",
    headers
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return format === "YAML" ? response.text() : response.json()
  })
}