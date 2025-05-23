from typing import Any, ClassVar

from universal_intelligence.core import AbstractUniversalTool, types

from awp.lib import parse_api, parse_html

Contract = types.Contract
Requirement = types.Requirement


class UniversalTool(AbstractUniversalTool):
    _contract: ClassVar[Contract] = {
        "name": "AWP Tool",
        "description": "A tool to parse AWP compliant HTML and API endpoints",
        "methods": [
            {
                "name": "parse_api",
                "description": "Parse an AWP compliant API endpoint",
                "arguments": [
                    {
                        "name": "url",
                        "type": "str",
                        "description": "The URL of the API endpoint to parse",
                        "required": True,
                    },
                    {
                        "name": "authorization",
                        "type": "str",
                        "description": "The authorization token to use for the API endpoint, if authentication is necessary",
                        "required": False,
                    },
                    {
                        "name": "format",
                        "type": "str",
                        "description": "The output format to parse the API endpoint into ('YAML', 'JSON'). YAML is default and recommended.",
                        "required": False,
                    },
                ],
                "outputs": [
                    {
                        "type": "Any",
                        "description": "The parsed API endpoint",
                        "required": True,
                    },
                    {
                        "type": "dict",
                        "description": "Log of the API call",
                        "required": True,
                    },
                ],
            },
            {
                "name": "parse_html",
                "description": "Parse an AWP compliant HTML page",
                "arguments": [
                    {
                        "name": "html",
                        "type": "str",
                        "description": "The HTML page to parse",
                        "required": True,
                    },
                    {
                        "name": "format",
                        "type": "str",
                        "description": "The output format to parse the HTML page into ('YAML', 'JSON'). YAML is default and recommended.",
                        "required": False,
                    },
                ],
                "outputs": [
                    {
                        "type": "Any",
                        "description": "The parsed HTML page",
                        "required": True,
                    },
                    {
                        "type": "dict",
                        "description": "Log of the HTML page parsing",
                        "required": True,
                    },
                ],
            },
            {
                "name": "contract",
                "description": "Get a copy of the tool's contract specification",
                "arguments": [],
                "outputs": [
                    {
                        "type": "Contract",
                        "schema": {},
                        "description": "A copy of the tool's contract specification",
                        "required": True,
                    }
                ],
            },
            {
                "name": "requirements",
                "description": "Get a copy of the tool's configuration requirements",
                "arguments": [],
                "outputs": [
                    {
                        "type": "List[Requirement]",
                        "schema": {},
                        "description": "A list of the tool's configuration requirements",
                        "required": True,
                    }
                ],
            },
        ],
    }

    _requirements: ClassVar[list[Requirement]] = []

    @classmethod
    def contract(cls) -> Contract:
        return cls._contract.copy()

    @classmethod
    def requirements(cls) -> list[Requirement]:
        return cls._requirements.copy()

    def __init__(self, verbose: str = "DEFAULT") -> None:
        self._verbose = verbose

    def parse_api(self, **kwargs) -> tuple[Any, dict[str, Any]]:
        return parse_api(**kwargs), {"success": True}

    def parse_html(self, **kwargs) -> tuple[Any, dict[str, Any]]:
        return parse_html(**kwargs), {"success": True}
