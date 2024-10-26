import { fromBinary } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import { DiscoveryService } from "./proto/ydb_discovery_v1_pb";
import { ListEndpointsResultSchema } from "./proto/protos/ydb_discovery_pb";

// 1. Start YDB `npm run ydb` (https://ydb.tech/docs/en/quickstart)
// 2. Generate code `npm run gen`
// 3. Run with file `npm start` (node --import=tsx index.ts, bun index.ts)

const transport = createGrpcTransport({
    baseUrl: "http://localhost:2138",
    httpVersion: "2",
    interceptors: [],
});

console.log("Listing endpoints...")

const discoveryService = createClient(DiscoveryService, transport);
const response = await discoveryService.listEndpoints({ database: "/Root/slo" }, { timeoutMs: 5000 })
let { endpoints } = fromBinary(ListEndpointsResultSchema, response.operation?.result?.value!)

console.log(endpoints)
