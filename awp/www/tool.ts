import uin from "universalintelligence"

import { parseApi, parseHtml } from "./lib"

export class UniversalTool extends uin.core.AbstractUniversalTool {
  private static readonly _contract: uin.core.UniversalIntelligenceTypes.Contract = {
    name: "AWP Tool",
    description: "A tool to parse AWP compliant HTML and API endpoints",
    methods: [
      {
        name: "parseApi",
        description: "Parse an AWP compliant API endpoint",
        arguments: [
          {
            name: "url",
            type: "string",
            description: "The URL of the API endpoint to parse",
            required: true,
          },
          {
            name: "authorization",
            type: "string",
            description: "The authorization token to use for the API endpoint, if authentication is necessary",
            required: false,
          },
          {
            name: "format",
            type: "string",
            description: "The output format to parse the API endpoint into ('YAML', 'JSON'). YAML is default and recommended.",
            required: false,
          },
        ],
        outputs: [
          {
            type: "any",
            description: "The parsed API endpoint",
            required: true,
          },
          {
            type: "Record<string, any>",
            description: "Log of the API call",
            required: true,
          },
        ],
        asynchronous: true
      },
      {
        name: "parseHtml",
        description: "Parse an AWP compliant HTML page",
        arguments: [
          {
            name: "html",
            type: "string",
            description: "The HTML page to parse",
            required: true,
          },
          {
            name: "format",
            type: "string",
            description: "The output format to parse the HTML page into ('YAML', 'JSON'). YAML is default and recommended.",
            required: false,
          },
        ],
        outputs: [
          {
            type: "any",
            description: "The parsed HTML page",
            required: true,
          },
          {
            type: "Record<string, any>",
            description: "Log of the HTML page parsing",
            required: true,
          },
        ],
        asynchronous: true
      },
      {
        name: "contract",
        description: "Get a copy of the tool's contract specification",
        arguments: [],
        outputs: [
          {
            type: "Contract",
            description: "A copy of the tool's contract specification",
            required: true
          }
        ]
      },
      {
        name: "requirements",
        description: "Get a copy of the tool's configuration requirements",
        arguments: [],
        outputs: [
          {
            type: "Requirement[]",
            description: "A list of the tool's configuration requirements",
            required: true
          }
        ]
      }
    ]
  }

  private static readonly _requirements: uin.core.UniversalIntelligenceTypes.Requirement[] = []

  private _configuration: Record<string, any>

  static contract(): uin.core.UniversalIntelligenceTypes.Contract {
    return { ...UniversalTool._contract }
  }

  static requirements(): uin.core.UniversalIntelligenceTypes.Requirement[] {
    return [...UniversalTool._requirements]
  }

  contract(): uin.core.UniversalIntelligenceTypes.Contract {
    return { ...UniversalTool._contract }
  }

  requirements(): uin.core.UniversalIntelligenceTypes.Requirement[] {
    return [...UniversalTool._requirements]
  }

  constructor(configuration?: Record<string, any>) {
    super(configuration)
    this._configuration = configuration || {}
  }

  async parseApi(payload?: any): Promise<[any, Record<string, any>]> {
    const result = await parseApi(payload)
    return [result, { success: true }]
  }

  async parseHtml(payload?: any): Promise<[any, Record<string, any>]> {
    const result = await parseHtml(payload)
    return [result, { success: true }]
  }
} 