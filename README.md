![awp-banner](https://fasplnlepuuumfjocrsu.supabase.co/storage/v1/object/public/web-assets//awp-banner-rsmrx.png)

<p align="center">
    <a href="https://github.com/blueraai/agentic-web-protocol/releases"><img alt="GitHub Release" src="https://img.shields.io/github/release/blueraai/agentic-web-protocol.svg?color=1c4afe"></a>
    <a href="https://github.com/blueraai/agentic-web-protocol/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/blueraai/agentic-web-protocol.svg?color=00bf48"></a>
    <a href="https://discord.gg/7g9SrEc5yT"><img alt="Discord" src="https://img.shields.io/badge/Join-Discord-7289DA?logo=discord&logoColor=white&color=4911ff"></a>
</p>

> ![lng_icon](https://fasplnlepuuumfjocrsu.supabase.co/storage/v1/object/public/web-assets//icons8-python-16.png) This page aims to document **Python** protocols and usage (e.g. cloud, desktop).
>
> Looking for [**Javascript/Typescript instructions**](https://github.com/blueraai/agentic-web-protocol/blob/main/README_WEB.md)?

## Overview

The `Agentic Web Protocol`, or `AWP`, *allows **AI agents** to reliably **understand and interact with the web***.

It is composed of two protocols, for web pages and APIs, allowing them to be usable by AI agents.

A standard [Universal Tool](https://github.com/blueraai/universal-intelligence) is also provided, for AI agents to be able to instantly leverage `AWP` compliant pages and APIs.

> 🤖 Discoverable Websites and APIs, for AI Agents interactions. [Bluera Inc.](https://bluera.ai)

Learn more about how to support `AWP`, by clicking the most appropriate option for you:
<details>
<summary><strong style="display: inline; cursor: pointer; margin: 0; padding: 0;">I make websites or APIs, what do I need to do?</strong></summary>

##### Websites

- See the `AWP` *Protocol Specifications* below, and familiarize yourself with the standard `ai` parameters
- Add the appropriate `ai` parameters to your website.

> 🎉 Your website can be reliably used by any AI agent!

##### APIs

- See the `AWP` *Protocol Specifications* below, and familiarize yourself with the standard `/ai-handshake` endpoint
- Add the standard `/ai-handshake` endpoint to your API.

> 🎉 Your API can be reliably used by any AI agent!

</details>

<details>
<summary><strong style="display: inline; cursor: pointer; margin: 0; padding: 0;">I make/use AI Agents, what do I need to do?</strong></summary>
<br>

- See the `AWP` *Tool* below, and familiarize yourself with its `parse_html` and `parse_api` methods.
- Add the `AWP` *Tool* to your AI Agent.

> 🎉 Your AI agent can now reliably use any `AWP` compliant websites or APIs!

</details>

## Documentation

<details>
<summary><strong style="display: inline; cursor: pointer; margin: 0; padding: 0;">Protocol Specifications</strong></summary>

## Protocol Specifications

### Web pages

#### Introduction

Without information about what a web page is for, how it is structured, what features it provides, and how to interact with it, an AI agent has to figure out everything on its own. This is commonly done through crawlers and/or vision models aimed at parsing what the agent sees -often leading to unreliable parsing and broken/unintended interactions. 

The premise of `AWP` is simple: **include standard information in the HTML page** itself, for **any agent to be able to reliably understand and interact** with it.

For an agent to so, the following information needs to be attached to all *meaninful* and/or *interactive* HTML tags:

1. A `description`, for it to know what it is.
2. A list of possible `interactions`, for it to know what to do.
3. A list of `prerequisites`, for it to know what to do prior to interacting.
4. A list of subsequent `features`, for it to know what those interactions lead to.

#### Contract

With `AWP`, this information is now declared in the HTML itself, through standard `ai-*` parameters.

Here is a simple example:

```html
<html ai-description="Travel site to book flights and trains">
  <body>
    <form ai-description="Form to book a flight">
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
        minlength="3"
        maxlength="30"
        size="10" />
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
```

##### Standard Parameters

| Parameter | Description | Requirement |
|--------|-------------|----------|
| `ai-description` | A natural language description for agents to know what the element is | • Meaningful Element: `required`<br>• Interactive Element: `required`<br>• Other Element: `absent` |
| `ai-interactions` | A list of possible interactions, for agents to know what to do with the element<br><br>Format:<br><br>`<interaction>: <behavior>; <interaction>: <behavior>;..` | • Meaningful Element: `absent`<br>• Interactive Element: `required`<br>• Other Element: `absent` |
| `ai-prerequisite-<interaction>` | A list of prerequisite interactions, for agents to know what to do prior to interacting with the element<br><br>Format:<br><br>`<ai-ref>: <interaction>;..` | • Meaningful Element: `absent`<br>• Interactive Element: `optional`<br>• Other Element: `absent` |
| `ai-ref` | A unique identifier for agents to know where those prerequisite interactions should be made | • Meaningful Element: `absent`<br>• Interactive Element: `optional`<br>• Other Element: `absent` |
| `ai-next-<interaction>` | A list of subsequent features, for agents to know what those interactions lead to<br><br>Format:<br><br>`<next feature>; <next feature>;..` | • Meaningful Element: `absent`<br>• Interactive Element: `required`<br>• Other Element: `absent` |

> An AWP Tool is also distributed by this library to allow any AI agent to reliably use `AWP` compliant websites.

### APIs

Without information about what an API is for, how it is structured, what features it provides, and how to interact with it, an AI agent has to figure out everything on its own. This is commonly passed manually as context, fetched via web crawlers attempting to find documentation online, or by spinning up additional middleware servers (eg. [mcp](https://github.com/modelcontextprotocol)) to allow them to be discoverable.

The premise of `AWP` is simple: **include standard information in the API** itself, for **any agent to be able to reliably understand and interact** with it, without requiring additional middleware servers to do so.

For an agent to know how to use any API, the following information needs to be discoverable:

1. A list of all each available `endpoints` on that API, to know what they are
2. A `description` for each endpoint, to know what they are for
3. `meta` information for each endpoint, to know how to access them
4. An `input` documentation for each endpoint, to know what to provide
5. An `output` documentation for each endpoint, to know what to expect

#### Contract

With `AWP`, the API documentation is made accessible on the API itself, with a standard `/ai-handshake` endpoint.

This allows AI agents to query `/ai-handshake`, get a complete description of the API, and know how to further interact with it.

For simplicity, and since it is a well established standard on the web, the `AWP` expects a [OpenAPI](https://swagger.io/specification/) compliant documentation to be returned by that endpoint.

Here is a simple example:
[https://editor.swagger.io](https://editor.swagger.io)

##### Standard Endpoint

| Path | Description | Type | Method | Input | Output | Requirement |
|--------|--------------------------------|----------|----------|----------|----------|----------|
| `/ai-handshake` | Standard endpoint returning a [OpenAPI](https://swagger.io/specification/) compliant documentation of the API which hosts the endpoint, excluding `/ai-handshake`, JSON or YAML based on headers | REST | GET | Headers:<br><br>`"Content-Type": "application/yaml"`(recommended)<br>or<br>`"Content-Type": "application/json"` | [OpenAPI](https://swagger.io/specification/) compliant documentation, of requested `Content-Type` (eg. YAML, JSON, text) | `required` |

> An AWP Tool is also distributed by this library to allow any AI agent to reliably use `AWP` compliant API.

</details>

<details>
<summary><strong style="display: inline; cursor: pointer; margin: 0; padding: 0;">AWP Tool</strong></summary>

## AWP Tool

This project also shares a [Universal Tool](https://github.com/blueraai/universal-intelligence) for your agents to be able **reliably understand and interact with the AWP compliant Web pages and APIs**.

> For more information about `Universal Tools`, see [◉ Universal Intelligence](https://github.com/blueraai/universal-intelligence)

### Installation

```bash
pip install awp

# (if using universal tool) Choose relevant UIN install for your device
pip install "universal-intelligence[community,mps]" # Apple
pip install "universal-intelligence[community,cuda]" # NVIDIA
```

### Usage

#### Standard

```python
import awp

# Get HTML documentation
html_doc = awp.parse_html(html)

# Get API documentation
api_doc = awp.parse_api(url)
```

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `parse_html` | • `html: str`: HTML page to parse<br>• `format: str \| None = "YAML"`: Output format | `Any` | Parses all AWP `ai-*` parameters on the page and returns a documentation in the requested format (YAML, JSON), usable by any AI agent to reliably understand and interact with that web page |
| `parse_api` | • `url: str`: URL of the API to parse<br>• `authorization: str \| None = None`: Authentication header if required<br>• `format: str \| None = "YAML"`: Output format | `Any` | Calls the standard `/ai-handshake` endpoint of that API and returns an [OpenAPI](https://swagger.io/specification/) compliant documentation of that API in the requested format (YAML, JSON), usable by any AI agent to reliably understand and interact with that API |

#### As [Universal Tool](https://github.com/blueraai/universal-intelligence)

```python
from awp import UniversalTool as AWP

# Get HTML documentation
html_doc, logs = AWP().parse_html(html)

# Get API documentation
api_doc, logs = AWP().parse_api(url)
```

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `__init__` | • `verbose: bool \| str = "DEFAULT"`: Enable/Disable logs, or set a specific log level | `None` | Initialize a Universal Tool |
| `parse_html` | • `html: str`: HTML page to parse<br>• `format: str \| None = "YAML"`: Output format | `Tuple[Any, Dict]` | Parses all AWP `ai-*` parameters on the page and returns a documentation in the requested format (YAML, JSON), usable by any AI agent to reliably understand and interact with that web page |
| `parse_api` | • `url: str`: URL of the API to parse<br>• `authorization: str \| None = None`: Authentication header if required<br>• `format: str \| None = "YAML"`: Output format | `Tuple[Any, Dict]` | Calls the standard `/ai-handshake` endpoint of that API and returns an [OpenAPI](https://swagger.io/specification/) compliant documentation of that API in the requested format (YAML, JSON), usable by any AI agent to reliably understand and interact with that API |
| `(class).contract` | None | `Contract` | Tool description and interface specification |
| `(class).requirements` | None | `List[Requirement]` | Tool configuration requirements |

#### Example Output

##### Parse HTML

###### Input

```html
<html ai-description="Travel site to book flights and trains">
  <body>
    <form ai-description="Form to book a flight" class="form-booking-flight">
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
        minlength="3"
        maxlength="30"
        size="10" />
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
```

###### Output

```yaml
elements:
  - selector: html
    description: Travel site to book flights and trains
    contains:
      - selector: html body form.form-booking-flight
        description: Form to book a flight
        contains:
          - selector: html body form.form-booking-flight h1
            description: Form description
            content: Book a flight
          - selector: html body form.form-booking-flight label
            description: Form query
            content: Where to?
          - selector: >-
              html body form.form-booking-flight
              input#destination[name='destination'][type='text']
            description: Form input where to enter the destination
            available_interactions:
              - type: input
                description: >-
                  enables the form confirmation button, given certain
                  constraints
            parameters:
              maxlength: 30
              minlength: 3
              name: destination
              required: true
              type: text
          - selector: html body form.form-booking-flight div button
            description: Confirmation button to proceed with booking a flight
            content: See available flights
            available_interactions:
              - type: click
                description: proceed
                prerequisites:
                  - selector: >-
                      html body form.form-booking-flight
                      input#destination[name='destination'][type='text']
                    interaction: input destination
                next_features:
                  - list of available flights
                  - book a flight
                  - login
              - type: hover
                description: diplay additonal information about possible flights
          - selector: html body form.form-booking-flight div button:nth-of-type(2)
            description: Cancel button to get back to the home page
            content: Back
            available_interactions:
              - type: click
                description: dismiss form and return to home page
                next_features:
                  - access forms to book trains
                  - access forms to book flights
      
```

> YAML (default) or JSON per requested format. 
> 
> YAML recommended for improved token efficiency and stability.

##### Parse API

###### Input

`GET https//example.api.com/ai-handshake`

###### Output

[OpenAPI](https://swagger.io/specification/) compliant documentation, YAML (default) or JSON per requested format.

Example available [here](https://editor.swagger.io).

> **Tip**: Tools like [Swagger](https://swagger.io) can automatically generate a [OpenAPI](https://swagger.io/specification/) compliant documentation for your API which you may serve at `/ai-handshake`. They usually also provide no-code UIs to display and interact wich that documentation on the web (eg. [Swagger UI](https://editor.swagger.io)).

#### Playground

A ready-made playground is available to help familiarize yourself with the AWP protocols and tools.

```sh
# Install project dependencies
pip install -r requirements.txt 
# Choose relevant UIN install for your device
pip install "universal-intelligence[community,mps]" # Apple
pip install "universal-intelligence[community,cuda]" # NVIDIA

# Run
python -m playground.example 
```

### Cross-Platform Support

![lng_icon](https://fasplnlepuuumfjocrsu.supabase.co/storage/v1/object/public/web-assets//icons8-python-16.png) ![lng_icon](https://fasplnlepuuumfjocrsu.supabase.co/storage/v1/object/public/web-assets//icons8-javascript-16.png) The `AWP` tool can be used across **all platforms** (cloud, desktop, web, mobile).

- ![lng_icon](https://fasplnlepuuumfjocrsu.supabase.co/storage/v1/object/public/web-assets//icons8-python-16.png) [How to use natively with `python` (cloud, desktop)](https://github.com/blueraai/agentic-web-protocol/blob/main/README.md)
- ![lng_icon](https://fasplnlepuuumfjocrsu.supabase.co/storage/v1/object/public/web-assets//icons8-javascript-16.png) [How to use on the web, or in web-native apps, with `javascript/typescript` (cloud, desktop, web, mobile)](https://github.com/blueraai/agentic-web-protocol/blob/main/README_WEB.md)

</details>

## Support

This software is open source, free for everyone, and lives on thanks to the community's support ☕

If you'd like to support to `agentic-web-protocol` here are a few ways to do so:

- ⭐ Consider leaving a star on this repository to support our team & help with visibility
- 👽 Tell your friends and collegues
- 📰 Support this project on social medias (e.g. LinkedIn, Youtube, Medium, Reddit)
- ✅ Adopt the `AWP` specification
- 💪 Use the [AWP Tool](https://pypi.org/project/agentic-web-protocol/)
- 💡 Help surfacing/resolving issues
- 💭 Help shape the `AWP` specification
- 🔧 Help maintain, test, enhance the [AWP Tool](https://github.com/blueraai/agentic-web-protocol/blob/main/awp/)
- ✉️ Email us security concerns
- ❤️ Sponsor this project on Github
- 🤝 [Partner with Bluera](mailto:contact@bluera.ai)


## License

Apache 2.0 License - [Bluera Inc.](https://bluera.ai)