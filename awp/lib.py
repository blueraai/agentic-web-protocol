import json
from typing import Any

import requests
import yaml
from bs4 import BeautifulSoup


def parse_html(html: str, format: str = "YAML") -> Any:  # noqa: C901
    """
    Parse the HTML content and return a description usable by an AI agent to understand and interact with the content.

    Args:
        html (str): HTML page to parse
        format (str, optional): Output format. Defaults to "YAML". Can be "YAML" or "JSON".

    Returns:
        Any: Structured documentation in the requested format (YAML/JSON)
    """
    soup = BeautifulSoup(html, "html.parser")

    # Dictionary to store ai-ref to selector mappings
    ai_ref_map: dict[str, str] = {}

    def has_ai_attribute(element) -> bool:
        """Check if element has any ai- attribute."""
        return any(attr.startswith("ai-") for attr in element.attrs)

    def get_nested_text_content(element) -> str:
        """Get text content including nested content up to elements with ai- attributes."""
        content = []

        # Process child nodes
        for child in element.children:
            if isinstance(child, str):
                text = child.strip()
                if text:
                    content.append(text)
            else:
                # Stop if child has ai- attributes
                if has_ai_attribute(child):
                    break
                # Recursively get content from child
                child_content = get_nested_text_content(child)
                if child_content:
                    content.append(child_content)

        return " ".join(content).strip()

    def generate_selector(element) -> str:
        """Generate a unique CSS selector for an element."""
        # Build selector parts starting from the element
        selector_parts = []
        current = element

        while current and current.name:
            # Start with element name
            part = current.name

            # Add class if present
            if current.get("class"):
                part += "." + ".".join(current.get("class"))

            # Add id if present
            if current.get("id"):
                part += f"#{current.get('id')}"

            # Add name for form elements
            if current.get("name"):
                part += f"[name='{current.get('name')}']"

            # Add type for inputs
            if current.name == "input" and current.get("type"):
                part += f"[type='{current.get('type')}']"

            # Add placeholder for inputs and textareas
            if current.name in ["input", "textarea"] and current.get("placeholder"):
                part += f"[placeholder='{current.get('placeholder')}']"

            # Add value for inputs
            if current.name == "input" and current.get("value"):
                part += f"[value='{current.get('value')}']"

            # If we still don't have a unique selector, add position
            if len(soup.select(" ".join([*selector_parts, part]))) > 1:
                # Count similar elements before this one
                similar_elements = current.find_previous_siblings(current.name)
                if similar_elements:
                    part += f":nth-of-type({len(list(similar_elements)) + 1})"

            selector_parts.insert(0, part)
            current = current.parent

        # Remove [document] prefix if present
        selector = " ".join(selector_parts)
        return selector.replace("[document] ", "")

    def parse_element(element):
        result = {}

        # Generate unique selector
        selector = generate_selector(element)
        result["selector"] = selector

        # Store ai-ref to selector mapping if present
        if element.get("ai-ref"):
            ai_ref_map[element.get("ai-ref")] = selector

        # Get description if present
        if element.get("ai-description"):
            result["description"] = element.get("ai-description")

        # Get nested text content if present
        content = get_nested_text_content(element)
        if content:
            result["content"] = content

        # Parse interactions if present
        if element.get("ai-interactions"):
            interactions = []
            for interaction in element.get("ai-interactions").split(";"):
                if not interaction.strip():
                    continue
                interaction_type, description = interaction.split(":", 1)
                interaction_data = {"type": interaction_type.strip(), "description": description.strip()}

                # Parse prerequisites if present
                prereq_key = f"ai-prerequisite-{interaction_type.strip()}"
                if element.get(prereq_key):
                    prereqs = []
                    for prereq in element.get(prereq_key).split(";"):
                        if not prereq.strip():
                            continue
                        ai_ref, interaction = prereq.split(":", 1)
                        # Get the selector for this ai-ref
                        prereq_selector = ai_ref_map.get(ai_ref)
                        if prereq_selector:
                            prereqs.append({"selector": prereq_selector, "interaction": interaction.strip()})
                    if prereqs:
                        interaction_data["prerequisites"] = prereqs

                # Parse next features if present
                next_key = f"ai-next-{interaction_type.strip()}"
                if element.get(next_key):
                    next_features = [f.strip() for f in element.get(next_key).split(";") if f.strip()]
                    interaction_data["next_features"] = next_features

                interactions.append(interaction_data)

            if interactions:
                result["available_interactions"] = interactions

        # Parse parameters for input elements
        if element.name == "input":
            params = {}
            # List of all possible input attributes
            input_attrs = ["accept", "alt", "autocapitalize", "capture", "checked", "disabled", "list", "max", "maxlength", "min", "minlength", "multiple", "name", "pattern", "placeholder", "readonly", "required", "src", "step", "type", "value"]

            for attr in input_attrs:
                # For boolean attributes, check if they exist rather than their value
                if attr in ["checked", "disabled", "multiple", "readonly", "required"]:
                    if attr in element.attrs:
                        params[attr] = True
                elif element.get(attr):
                    # Convert numeric attributes to numbers
                    if attr in ["max", "maxlength", "min", "minlength", "step"]:
                        try:
                            params[attr] = int(element.get(attr))
                        except ValueError:
                            params[attr] = element.get(attr)
                    else:
                        params[attr] = element.get(attr)

            if params:
                result["parameters"] = params

        # Parse parameters for textarea elements
        elif element.name == "textarea":
            params = {}
            # List of textarea attributes
            textarea_attrs = ["minlength", "maxlength", "readonly", "required", "name", "placeholder"]

            for attr in textarea_attrs:
                if element.get(attr):
                    # Convert boolean attributes to actual booleans
                    if attr == "required":
                        params[attr] = True
                    # Convert numeric attributes to numbers
                    elif attr in ["minlength", "maxlength"]:
                        try:
                            params[attr] = int(element.get(attr))
                        except ValueError:
                            params[attr] = element.get(attr)
                    else:
                        params[attr] = element.get(attr)

            if params:
                result["parameters"] = params

        # Recursively parse child elements
        children = []
        for child in element.find_all(recursive=False):
            child_data = parse_element(child)
            if child_data:
                # If child_data is a list (from a parent without ai- attributes),
                # extend the children list with its contents
                if isinstance(child_data, list):
                    children.extend(child_data)
                else:
                    children.append(child_data)

        if children:
            result["contains"] = children

        # Only return elements that have ai- attributes
        if has_ai_attribute(element):
            return result
        # If element has no ai- attributes but has children with ai- attributes,
        # return just the children
        if children:
            return children
        return None

    # Start parsing from the root element
    root = soup.find()
    if not root:
        return None

    result = {"elements": [parse_element(root)]}

    # Convert to requested format
    if format.upper() == "JSON":
        return json.dumps(result, indent=2)
    else:
        return yaml.dump(result, sort_keys=False, default_flow_style=False)


def parse_api(url: str, authorization: str | None = None, format: str = "YAML") -> Any:
    """
    Parse the API /ai-handshake endpoint and returns its content in the requested format.
    """
    _default_headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/yaml" if format == "YAML" else "application/json",
        "Content-Type": "application/yaml" if format == "YAML" else "application/json",
    }

    if authorization:
        _default_headers["Authorization"] = authorization

    response = requests.get(url if url.endswith("/ai-handshake") else f"{url}/ai-handshake", method="GET", headers=_default_headers)
    response.raise_for_status()

    if format == "YAML":
        return response.text
    else:
        return response.json()
