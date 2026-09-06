// Maintainer-only - not one of the example routes (`generators/routes.ts`
// never reads this file, so it's never shipped to a scaffolded project). Pulls in
// @asterflow/multipart's module augmentation (adds `.multipart(...)` to
// `Method`) so `upload.ts` typechecks standalone here, the same way it does
// in a real scaffolded project once that project's `src/index.ts` imports
// the plugin.
import '@asterflow/multipart'
