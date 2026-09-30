**Apache Kafka** is a distributed event-streaming platform: a durable, high-throughput log that applications write events to and read events from in real time. It's the backbone of streaming data architectures — order events, clickstreams, IoT telemetry, database change streams and microservice communication.

## Core concepts

- **Event (record)** — a key, a value (payload), a timestamp and optional headers.
- **Topic** — a named stream of events, e.g. `orders.placed`.
- **Partition** — topics are split into partitions for parallelism. Each partition is an ordered, append-only log; each record has an **offset**.
- **Producer** — writes events to topics.
- **Consumer** — reads events; tracks its position with committed offsets.
- **Consumer group** — consumers sharing a group id split a topic's partitions between them, so each event is processed by one member of the group. Different groups each get all events.
- **Broker / cluster** — servers storing partitions, replicated for fault tolerance.
- **Retention** — events are kept for a configured time (e.g. 7 days) or size, regardless of whether they've been consumed; **compacted topics** keep the latest value per key.

```text
Producers ──► topic "orders" ──► partition 0: [0][1][2][3]...
                               ├─ partition 1: [0][1][2]...
                               └─ partition 2: [0][1][2][3][4]...
                                        │
                     Consumer group "billing":   C1 ← p0, p1    C2 ← p2
                     Consumer group "analytics": C1 ← p0, p1, p2
```

## Ordering and keys

Kafka guarantees order **within a partition**, not across a topic. Events with the same **key** go to the same partition (by hashing), so use the entity id as the key when order matters — all events for `order_id=1042` stay in order.

## Producing events (Python)

```python
import json
from confluent_kafka import Producer

producer = Producer({
    "bootstrap.servers": "localhost:9092",
    "acks": "all",                 # wait for all in-sync replicas: durable writes
    "enable.idempotence": True,    # no duplicates from producer retries
})

def delivery_report(err, msg):
    if err is not None:
        print(f"Delivery failed: {err}")
    else:
        print(f"Delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}")

order = {"order_id": 1042, "customer_id": 10, "amount": 1299.0, "status": "placed"}
producer.produce(
    topic="orders",
    key=str(order["order_id"]),
    value=json.dumps(order),
    callback=delivery_report,
)
producer.flush()
```

## Consuming events

```python
import json
from confluent_kafka import Consumer

consumer = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "order-analytics",
    "auto.offset.reset": "earliest",     # where to start when the group has no committed offset
    "enable.auto.commit": False,         # commit only after successful processing
})
consumer.subscribe(["orders"])

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            print("Consumer error:", msg.error())
            continue
        event = json.loads(msg.value())
        process(event)                   # e.g. upsert into a table
        consumer.commit(message=msg)     # at-least-once: commit after processing
finally:
    consumer.close()
```

## Delivery semantics

| Semantics | Meaning | How |
| --- | --- | --- |
| At-most-once | Events may be lost, never duplicated | Commit before processing |
| At-least-once | Never lost, may be duplicated | Commit after processing (most common) |
| Exactly-once | Each event affects the result once | Idempotent producers + transactions, or idempotent/transactional sinks |

In practice: **at-least-once delivery + idempotent processing** (upserts keyed by event or entity id, deduplication by event id) is the robust default.

## Schemas and the schema registry

Producers and consumers evolve independently. A **schema registry** (Confluent Schema Registry, Apicurio, AWS Glue Schema Registry) stores versioned Avro/Protobuf/JSON schemas and enforces **compatibility rules** (e.g. backward compatible: new fields must have defaults), so a producer can't publish events that break consumers. This is how data contracts are enforced for streams.

## Kafka ecosystem

- **Kafka Connect** — ready-made source and sink connectors (databases, S3, warehouses, Elasticsearch) without writing code; Debezium CDC connectors run on it.
- **Kafka Streams / ksqlDB** — stream processing on Kafka itself.
- **Managed services** — Confluent Cloud, Amazon MSK, Azure Event Hubs (Kafka-compatible), Aiven; alternatives such as Redpanda (Kafka API-compatible), Google Pub/Sub and Amazon Kinesis.

## Sizing and operations basics

- **Partitions** set the maximum consumer parallelism in a group — plan for peak throughput, but avoid thousands of tiny partitions.
- **Replication factor 3** with `min.insync.replicas=2` and `acks=all` for durability.
- Monitor **consumer lag** (how far behind consumers are) — the key health metric for streaming pipelines.
- Put failing events on a **dead-letter topic** with the error, instead of blocking the partition.

## Running Kafka locally

```bash
docker run -d --name kafka -p 9092:9092 apache/kafka:latest
```

## Try it yourself

Run Kafka locally, create an `orders` topic with 3 partitions, write a producer that sends 1,000 order events keyed by customer id, and run two consumers in the same group — observe how partitions are split. Stop one consumer and watch the group rebalance; then make the consumer idempotent by upserting into DuckDB keyed by order id and replaying the topic from the beginning.
