# ADR 005: AWS S3 for Transaction Attachments

## Status

Accepted

## Context

The system must store transaction proof files (receipts, bills, screenshots) while running on Vercel with Neon PostgreSQL. PostgreSQL is optimized for relational records, not binary object storage. The app requires secure access, low operational overhead, and environment separation between development and production.

## Decision

We chose **AWS S3** for transaction attachment storage with private objects and pre-signed URLs.

1. **Storage separation**: Keep attachment metadata in PostgreSQL (`attachment_key`) and store binary files in S3.
2. **Access model**: Use short-lived pre-signed PUT URLs for uploads and pre-signed GET URLs for view/download.
3. **Environment isolation**: Use separate buckets:
   - `transaction-proof-dev` for development/preview
   - `transaction-proof` for production
4. **Validation policy**: Restrict attachment uploads to `application/pdf`, `image/jpeg`, and `image/png` with default max size `1 MB` (`ATTACHMENT_MAX_BYTES=1048576`).

## Consequences

- **Positive**: Durable object storage, lower app-server bandwidth, secure private-file access, and clean scaling with Vercel.
- **Negative**: Requires AWS IAM setup, bucket configuration, and additional env secret management.
- **Neutral**: Adds pre-signed URL orchestration in Server Actions and client-side direct upload handling.

## Alternatives Considered

1. **Store files in PostgreSQL**
   - Rejected because it increases DB size and operational cost, and is not ideal for object retrieval workflows.
2. **Public-read S3 objects**
   - Rejected due to financial/audit sensitivity; private access is required.
3. **Server-proxy uploads through Next.js only**
   - Rejected for primary path due to higher server bandwidth and latency. Pre-signed direct upload is better for scale.
