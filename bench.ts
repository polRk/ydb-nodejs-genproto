import { fromBinary } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { Bench } from 'tinybench';
import { ListEndpointsResultSchema } from './proto/protos/ydb_discovery_pb';
import { ExecuteYqlResultSchema } from './proto/protos/ydb_scripting_pb';
import { DiscoveryService } from './proto/ydb_discovery_v1_pb';
import { ScriptingService } from './proto/ydb_scripting_v1_pb';

const transport = createGrpcTransport({
    baseUrl: "http://localhost:2138",
    httpVersion: "2",
    interceptors: [],
});

const discoveryService = createClient(DiscoveryService, transport);
const response = await discoveryService.listEndpoints({ database: "/Root/slo" }, { timeoutMs: 5000 })

let { endpoints } = fromBinary(ListEndpointsResultSchema, response.operation?.result?.value!)

let pool = endpoints.map(endpoint => {
    const transport = createGrpcTransport({
        baseUrl: `http://${endpoint.address}:${endpoint.port}`,
        httpVersion: "2",
        interceptors: [],
    });

    return createClient(ScriptingService, transport);
})

let i = 0;
let len = pool.length;

let bench = new Bench({ time: 10_000 })
    .add('single', async () => {
        let node = 0
        let client = pool[node]

        // console.log("Single, Node:", 0)
        const response = await client.executeYql({ script: "SELECT 1;" }, { timeoutMs: 1000 })

        fromBinary(ExecuteYqlResultSchema, response.operation?.result?.value!)
    })
    .add('random', async () => {
        let node = Math.floor(Math.random() * len)
        let client = pool[node]

        // console.log("Random, Node:", node)
        const response = await client.executeYql({ script: "SELECT 1;" }, { timeoutMs: 1000 })

        fromBinary(ExecuteYqlResultSchema, response.operation?.result?.value!)
    })
    .add('round robin', async () => {
        let node = ++i % len
        let client = pool[node]

        // console.log("RRobin, Node:", i % len)
        const response = await client.executeYql({ script: "SELECT 1;" }, { timeoutMs: 1000 })

        fromBinary(ExecuteYqlResultSchema, response.operation?.result?.value!)
    })

await bench.warmup();
await bench.run();

console.table(bench.table());
