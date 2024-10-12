import { readFileSync } from "node:fs";
import { create, createRegistry, toJson } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { DiscoveryService } from "./proto/ydb_discovery_v1_pb.ts";
import { file_protos_ydb_discovery, ListEndpointsRequestSchema, ListEndpointsResponseSchema } from "./proto/protos/ydb_discovery_pb.ts";

// 1. Start YDB `npm run ydb` (https://ydb.tech/docs/en/quickstart)
// 2. Generate code `npm run gen`
// 3. Run with file `npm start` (node --import=tsx index.ts)

const transport = createGrpcTransport({
    baseUrl: "https://localhost:2135",
    nodeOptions: {
        ca: readFileSync(".ydb/ydb_certs/ca.pem"),
        key: readFileSync(".ydb/ydb_certs/key.pem"),
        cert: readFileSync(".ydb/ydb_certs/cert.pem"),
        ciphers: "DEFAULT@SECLEVEL=1"
    },
    httpVersion: "2",
    interceptors: [],
});

{
    const discoveryService = createClient(DiscoveryService, transport);

    console.log("Listing endpoints...")
    const request = create(ListEndpointsRequestSchema, { database: "local" })

    discoveryService.listEndpoints(request, { timeoutMs: 5000 })
        .then((response) => {
            console.log(response)

            const json = toJson(ListEndpointsResponseSchema, response, { registry: createRegistry(file_protos_ydb_discovery) });
            console.log(json)
        });
}
