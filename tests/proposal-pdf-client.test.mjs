import test from "node:test";
import assert from "node:assert/strict";
import {validatePdfHeader,MAX_PDF_BYTES,MAX_PDF_PAGES,MAX_PDF_CHARS} from "../src/lib/proposal-pdf-client.ts";
test("only PDF magic is accepted, with a strict byte limit",()=>{
 validatePdfHeader(new Uint8Array(Buffer.from("%PDF-1.4\n")));
 assert.throws(()=>validatePdfHeader(new Uint8Array(Buffer.from("<html>hello"))),/valid PDF header/);
 assert.throws(()=>validatePdfHeader(new Uint8Array(MAX_PDF_BYTES+1)),/5 MB/);
 assert.equal(MAX_PDF_PAGES,12);
 assert.equal(MAX_PDF_CHARS,25000);
});
