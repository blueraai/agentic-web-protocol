import awp, { UniversalTool as AWP } from "../../distweb/index.js";
import { Agent } from "../../node_modules/universalintelligence/distweb/index.js";

import { html } from "./utils.js";

async function main() {
    // As Standard Library
    console.warn("awp", awp);
    const htmlDoc = await awp.parseHtml({ html })
    // const apiDoc = await awp.parseApi({ url: "https://api.example.com/flights" })
    console.warn("awp.parseHtml", { html }, htmlDoc);


    // 🤖 Simple web agent (🧠 + 🔧)
    const agent = new Agent();
    const [agentResult, agentLogs] = await agent.process(`Using the AWP Tool, output a list of actions to take on this web page to book a flight to London.\nHTML page: \n${html}`, { extraTools: [new AWP()] });

    console.warn("🤖 Simple Web Agent \n\n", agentResult, agentLogs);
}

main().catch(console.error);

// // 🤖 Simple API agent (🧠 + 🔧)
// const agent = new Agent();
// const [agentResult, agentLogs] = await agent.process(`Using the AWP Tool, output a list of actions to take on this API to book a flight to London.\nAPI: \nhttps://api.example.com/flights`, { extraTools: [AWP()] });

// console.warn("🤖 Simple API Agent \n\n", agentResult, agentLogs);


