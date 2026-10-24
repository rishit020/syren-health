# Syren Health Vercel launch

- Live: https://syrenhealth.com
- www.syrenhealth.com redirects to the apex using HTTP 308.
- GitHub: https://github.com/rishit020/syren-health (private), production branch main.
- Vercel project: syren-health in rishit020-8673s-projects.
- Project ID: prj_2OMiWlrelaKdLE1r9v1GYgZiStBQ.
- Initial production deployment: dpl_9X6U7dEwMQJ5XgWP2CTG4FjSwwb4, launch commit ad72d1bbf644f51184491450c34dd98cc1cb12a6.
- User explicitly approved skipping the PR/Greptile gate for this initial launch and requested all code on main. This was a new repository with no prior branches to merge.
- Vercel GitHub connection is enabled; future main pushes produce production deployments.

Vercel config selects Vite, npm run build, dist and SPA deep-link rewrites. Local evidence, recordings and credentials are excluded from Git. Runtime code and media are committed. Source attribution is retained.

Verification: HTTPS returned 200, www returned 308 to apex, desktop/mobile homepage/contact/404 and FAQ checks passed with no runtime or resource errors. The actual domain was opened and visually verified in the native local browser. Production screenshot/report evidence is stored locally under reference/validation/production/.

The production origin required separate FormSubmit activation, completed through the confirmation email at rishit020@gmail.com. Search-engine indexing is separate from direct domain reachability.
