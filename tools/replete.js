// replete.js
// Martin Pravda

/*jslint node */

import run_replete from "https://deno.land/x/replete@0.0.30/run.js";
import ecomcon from "./ecomcon.js";

run_replete({
    browser_port: 3000,
    deno_args: ["--allow-all", "--no-lock"],
    command(message) {
        message.source = ecomcon(message.source, ["test", "demo"]);
        return message;
    },
    which_node: "node"
});