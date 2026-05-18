export const EXAMPLE_LOG = `2026-05-18T09:23:14.881Z INFO  api.requests req_id=7f3c91b2-0a4d-4e2f-9b6c-2e8d5a1f3c47 method=GET path=/v1/users/482 status=200 duration_ms=42 ip=192.168.4.21 cached=true
2026-05-18T09:23:14.892Z WARN  auth.session token expiring soon for user="ada.lovelace" expires_in=58s renewable=true
2026-05-18T09:23:15.014Z ERROR db.pool connection timeout after 5000ms host=10.0.3.14 port=5432 retried=false
2026-05-18T09:23:15.118Z INFO  api.requests req_id=a91c2d5e-3f08-49a1-8b40-7c2e6f9d1a23 method=POST path=/v1/orders status=201 duration_ms=118 ip=172.16.0.4
2026-05-18T09:23:15.220Z DEBUG cache.lookup key="user:482:profile" hit=true age_ms=312
2026-05-18T09:23:15.341Z WARN  rate_limit client_ip=203.0.113.91 hits=98/100 window=60s blocked=false
2026-05-18T09:23:15.402Z ERROR api.requests method=GET path=/v1/users/9999 status=404 duration_ms=8 ip=192.168.4.21
2026-05-18T09:23:15.503Z FATAL worker.crash signal=SIGSEGV pid=4421 trace_id=2b8f4e91-c4a7-4ed3-b1f2-09e3d8a4c7e5
2026-05-18T09:23:15.611Z INFO  api.requests method=DELETE path=/v1/sessions/current status=204 duration_ms=15 ip=192.168.4.21
2026-05-18T09:23:15.720Z ERROR upstream.gateway method=POST path=/v1/payments status=503 duration_ms=4982 upstream=https://api.payments.internal/charge
2026-05-18T09:23:15.833Z INFO  http.access "GET /static/app.js HTTP/1.1" 200 48291 client=10.0.3.14
2026-05-18T09:23:15.941Z DEBUG scheduler.tick next_run="2026-05-18T09:24:00Z" pending_jobs=14 idle=false
2026-05-18T09:23:16.054Z WARN  fs.disk usage=87% path=/var/log/app mount=/dev/sda1
2026-05-18T09:23:16.162Z INFO  api.requests method=PATCH path=/v1/users/482 status=200 duration_ms=51 ip=192.168.4.21`
