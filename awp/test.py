import json
import unittest
from unittest.mock import MagicMock, patch

import yaml

from awp.lib import parse_api, parse_html
from awp.tool import UniversalTool

# ANSI color codes
BLUE = "\033[94m"
GREEN = "\033[92m"
RESET = "\033[0m"


class TestLib(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.maxDiff = None  # Show full diff in case of failure

    def print_selector_mapping(self, element, selector):
        """Helper method to print element and its generated selector."""
        print(f"\nElement: {element.name}")
        print(f"Attributes: {dict(element.attrs)}")
        print(f"Generated selector: {selector}")
        print("-" * 50)

    def test_parse_html_yaml(self):
        """Test parse_html function with YAML output format"""
        print(f"\n{BLUE}Test: parse_html_yaml{RESET}")
        print("=" * 50)
        print("\nInput HTML:")
        print("-" * 50)
        html = """
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
        """
        print(html)

        result = parse_html(html, format="YAML")
        parsed = yaml.safe_load(result)

        print("\nOutput YAML:")
        print("-" * 50)
        print(yaml.dump(parsed, sort_keys=False))

        # Test basic structure
        self.assertIn("elements", parsed)
        self.assertEqual(len(parsed["elements"]), 1)

        # Test HTML element
        html_elem = parsed["elements"][0]
        self.assertEqual(html_elem["description"], "Travel site to book flights and trains")
        self.assertIn("contains", html_elem)
        self.assertTrue(html_elem["selector"])

        # Test form element
        form_elem = html_elem["contains"][0]
        self.assertEqual(form_elem["description"], "Form to book a flight")
        self.assertIn("contains", form_elem)
        self.assertTrue(form_elem["selector"])

        # Test h1 element
        h1_elem = form_elem["contains"][0]
        self.assertEqual(h1_elem["description"], "Form description")
        self.assertEqual(h1_elem["content"], "Book a flight")
        self.assertTrue(h1_elem["selector"])

        # Test label element
        label_elem = form_elem["contains"][1]
        self.assertEqual(label_elem["description"], "Form query")
        self.assertEqual(label_elem["content"], "Where to?")
        self.assertTrue(label_elem["selector"])

        # Test input element
        input_elem = form_elem["contains"][2]
        self.assertEqual(input_elem["description"], "Form input where to enter the destination")
        self.assertIn("parameters", input_elem)
        self.assertEqual(input_elem["parameters"]["type"], "text")
        self.assertEqual(input_elem["parameters"]["name"], "destination")
        self.assertEqual(input_elem["parameters"]["required"], True)
        # Verify numeric parameters are actual numbers
        self.assertEqual(input_elem["parameters"]["minlength"], 3)
        self.assertEqual(input_elem["parameters"]["maxlength"], 30)
        self.assertTrue(input_elem["selector"])

        # Test input interactions
        self.assertIn("available_interactions", input_elem)
        input_interaction = input_elem["available_interactions"][0]
        self.assertEqual(input_interaction["type"], "input")
        self.assertEqual(input_interaction["description"], "enables the form confirmation button, given certain constraints")

        # Test button elements
        confirm_button = form_elem["contains"][3]
        self.assertEqual(confirm_button["description"], "Confirmation button to proceed with booking a flight")
        self.assertEqual(confirm_button["content"], "See available flights")
        self.assertTrue(confirm_button["selector"])

        # Test confirm button interactions
        self.assertIn("available_interactions", confirm_button)
        click_interaction = confirm_button["available_interactions"][0]
        self.assertEqual(click_interaction["type"], "click")
        self.assertEqual(click_interaction["description"], "proceed")
        self.assertIn("prerequisites", click_interaction)
        self.assertIn("next_features", click_interaction)

        # Test prerequisites
        prereq = click_interaction["prerequisites"][0]
        self.assertTrue(prereq["selector"])
        self.assertEqual(prereq["interaction"], "input destination")

        # Test next features
        self.assertIn("list of available flights", click_interaction["next_features"])
        self.assertIn("book a flight", click_interaction["next_features"])
        self.assertIn("login", click_interaction["next_features"])

        # Test hover interaction
        hover_interaction = confirm_button["available_interactions"][1]
        self.assertEqual(hover_interaction["type"], "hover")
        self.assertEqual(hover_interaction["description"], "diplay additonal information about possible flights")

        # Test cancel button
        cancel_button = form_elem["contains"][4]
        self.assertEqual(cancel_button["description"], "Cancel button to get back to the home page")
        self.assertEqual(cancel_button["content"], "Back")
        self.assertTrue(cancel_button["selector"])

        # Test cancel button interactions
        cancel_interaction = cancel_button["available_interactions"][0]
        self.assertEqual(cancel_interaction["type"], "click")
        self.assertEqual(cancel_interaction["description"], "dismiss form and return to home page")
        self.assertIn("next_features", cancel_interaction)
        self.assertIn("access forms to book trains", cancel_interaction["next_features"])
        self.assertIn("access forms to book flights", cancel_interaction["next_features"])

        print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_html_json(self):
        """Test parse_html function with JSON output format"""
        print(f"\n{BLUE}Test: parse_html_json{RESET}")
        print("=" * 50)
        print("\nInput HTML:")
        print("-" * 50)
        html = """
        <div ai-description="Test element">
          <input type="text" required minlength="5" maxlength="20" />
        </div>
        """
        print(html)

        result = parse_html(html, format="JSON")
        parsed = json.loads(result)

        print("\nOutput JSON:")
        print("-" * 50)
        print(json.dumps(parsed, indent=2))

        # Test basic structure
        self.assertIn("elements", parsed)
        self.assertEqual(len(parsed["elements"]), 1)

        # Test div element
        div_elem = parsed["elements"][0]
        self.assertEqual(div_elem["description"], "Test element")
        self.assertTrue(div_elem["selector"])
        # Since the input has no ai- attributes, it should not be included
        self.assertNotIn("contains", div_elem)

        print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_api_yaml(self):
        """Test parse_api function with YAML output format"""
        print(f"\n{BLUE}Test: parse_api_yaml{RESET}")
        print("=" * 50)
        mock_response = MagicMock()
        mock_response.text = """
        elements:
          - selector: <api-selector>
            description: API endpoint
            available_interactions:
              - type: get
                description: get data
        """

        with patch("requests.get", return_value=mock_response):
            result = parse_api("http://example.com", format="YAML")
            parsed = yaml.safe_load(result)

            # Test basic structure
            self.assertIn("elements", parsed)
            self.assertEqual(len(parsed["elements"]), 1)

            # Test API element
            api_elem = parsed["elements"][0]
            self.assertEqual(api_elem["description"], "API endpoint")
            self.assertEqual(api_elem["selector"], "<api-selector>")

            # Test interactions
            self.assertIn("available_interactions", api_elem)
            interaction = api_elem["available_interactions"][0]
            self.assertEqual(interaction["type"], "get")
            self.assertEqual(interaction["description"], "get data")

            print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_api_json(self):
        """Test parse_api function with JSON output format"""
        print(f"\n{BLUE}Test: parse_api_json{RESET}")
        print("=" * 50)
        mock_response = MagicMock()
        mock_response.json.return_value = {"elements": [{"selector": "<api-selector>", "description": "API endpoint", "available_interactions": [{"type": "get", "description": "get data"}]}]}

        with patch("requests.get", return_value=mock_response):
            result = parse_api("http://example.com", format="JSON")

            # Test basic structure
            self.assertIn("elements", result)
            self.assertEqual(len(result["elements"]), 1)

            # Test API element
            api_elem = result["elements"][0]
            self.assertEqual(api_elem["description"], "API endpoint")
            self.assertEqual(api_elem["selector"], "<api-selector>")

            # Test interactions
            self.assertIn("available_interactions", api_elem)
            interaction = api_elem["available_interactions"][0]
            self.assertEqual(interaction["type"], "get")
            self.assertEqual(interaction["description"], "get data")

            print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_api_authorization(self):
        """Test parse_api function with authorization header"""
        print(f"\n{BLUE}Test: parse_api_authorization{RESET}")
        print("=" * 50)
        mock_response = MagicMock()
        mock_response.text = "elements: []"

        with patch("requests.get") as mock_get:
            mock_get.return_value = mock_response
            parse_api("http://example.com", authorization="Bearer token")

            # Verify authorization header was set
            mock_get.assert_called_once()
            headers = mock_get.call_args[1]["headers"]
            self.assertEqual(headers["Authorization"], "Bearer token")

            print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_api_url_handling(self):
        """Test parse_api function URL handling"""
        print(f"\n{BLUE}Test: parse_api_url_handling{RESET}")
        print("=" * 50)
        mock_response = MagicMock()
        mock_response.text = "elements: []"

        with patch("requests.get") as mock_get:
            mock_get.return_value = mock_response

            # Test URL without /ai-handshake
            parse_api("http://example.com")
            mock_get.assert_called_with("http://example.com/ai-handshake", method="GET", headers=unittest.mock.ANY)

            # Test URL with /ai-handshake
            parse_api("http://example.com/ai-handshake")
            mock_get.assert_called_with("http://example.com/ai-handshake", method="GET", headers=unittest.mock.ANY)

            print(f"\n{GREEN}✓ Test passed successfully{RESET}")


class TestUniversalTool(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.tool = UniversalTool()

    def test_contract(self):
        """Test the contract method returns the correct contract specification"""
        print(f"\n{BLUE}Test: UniversalTool contract{RESET}")
        print("=" * 50)

        contract = self.tool.contract()

        # Test basic contract structure
        self.assertEqual(contract["name"], "AWP Tool")
        self.assertEqual(contract["description"], "A tool to parse AWP compliant HTML and API endpoints")
        self.assertIn("methods", contract)

        # Test methods
        methods = contract["methods"]
        method_names = [m["name"] for m in methods]
        self.assertIn("parse_api", method_names)
        self.assertIn("parse_html", method_names)
        self.assertIn("contract", method_names)
        self.assertIn("requirements", method_names)

        # Test parse_api method specification
        parse_api_method = next(m for m in methods if m["name"] == "parse_api")
        self.assertEqual(parse_api_method["description"], "Parse an AWP compliant API endpoint")
        self.assertIn("arguments", parse_api_method)
        self.assertIn("outputs", parse_api_method)

        # Test parse_html method specification
        parse_html_method = next(m for m in methods if m["name"] == "parse_html")
        self.assertEqual(parse_html_method["description"], "Parse an AWP compliant HTML page")
        self.assertIn("arguments", parse_html_method)
        self.assertIn("outputs", parse_html_method)

        print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_requirements(self):
        """Test the requirements method returns an empty list"""
        print(f"\n{BLUE}Test: UniversalTool requirements{RESET}")
        print("=" * 50)

        requirements = self.tool.requirements()
        self.assertEqual(requirements, [])

        print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_api(self):
        """Test the parse_api method"""
        print(f"\n{BLUE}Test: UniversalTool parse_api{RESET}")
        print("=" * 50)

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.text = "elements: []"
            mock_get.return_value = mock_response

            result, log = self.tool.parse_api(url="http://example.com")

            mock_get.assert_called_once_with(
                "http://example.com/ai-handshake", method="GET", headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", "Accept": "application/yaml", "Content-Type": "application/yaml"}
            )
            self.assertEqual(result, "elements: []")
            self.assertEqual(log, {"success": True})

            print(f"\n{GREEN}✓ Test passed successfully{RESET}")

    def test_parse_html(self):
        """Test the parse_html method"""
        print(f"\n{BLUE}Test: UniversalTool parse_html{RESET}")
        print("=" * 50)

        with patch("awp.tool.parse_html") as mock_parse_html:
            mock_parse_html.return_value = {"result": "test"}

            result, log = self.tool.parse_html(html="<div>test</div>")

            mock_parse_html.assert_called_once_with(html="<div>test</div>")
            self.assertEqual(result, {"result": "test"})
            self.assertEqual(log, {"success": True})

            print(f"\n{GREEN}✓ Test passed successfully{RESET}")


if __name__ == "__main__":
    unittest.main()
