# Vercel launch preparation

Target: syrenhealth.com, owned in the authenticated Vercel team rishit020-8673s-projects. The domain uses Vercel nameservers. Initial inspection found no Syren project and no functional HTTPS site.

- vercel.json selects Vite, npm run build, dist and SPA deep-link rewrites.
- .vercelignore excludes local evidence, secrets, node_modules and unused original-template page payloads. Required homepage/contact/404 payloads, interaction states and source motion data remain.
- .gitignore protects Vercel linkage and environment files.
- No production deployment or domain reassignment has been performed. The global github-delivery-gate requires a reviewed PR; this folder has no commit or remote. User decision about direct deployment is pending.

After authorization: deploy to the intended Vercel team, assign apex and www domains, verify TLS and routing, open the domain in the local browser, and check production assets/contact behavior. Search-engine indexing is separate from domain reachability and cannot be promised immediately.
