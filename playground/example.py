from universal_intelligence.community.agents.default import UniversalAgent as Agent  # https://github.com/blueraai/universal-intelligence

from awp import UniversalTool as AWP  # https://github.com/blueraai/awp
from playground.__utils__ import formatted_print, html

# 🤖 Simple Web agent (🧠 + 🔧)
agent = Agent()
result, logs = agent.process(
    f"""Using the AWP Tool, output a list of actions to take on this web page to book a flight to London.
                             
HTML page: 
{html}
""",
    extra_tools=[AWP()],
)

formatted_print("Simple Web Agent", result, logs)

# # 🤖 Simple API agent (🧠 + 🔧)
# agent = Agent()
# result, logs = agent.process(f"""Using the AWP Tool, output a list of actions to take on this API to book a flight to London.

# API:
# https://api.example.com/flights
# """, extra_tools=[AWP()])

# formatted_print("Simple API Agent", result, logs)
