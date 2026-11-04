import type {MetadataRoute} from "next";
/** Private research pilot: do not advertise routes for indexing yet. */
export default function robots():MetadataRoute.Robots {
 return {rules:[{userAgent:"*",disallow:"/"}]};
}
