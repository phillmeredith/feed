/**
 * The three shapes a block of a section can take.
 *
 * Both the section fronts and the desk pages are lists of blocks, and both
 * were rendering every block identically — a page of one repeated shape reads
 * as a table of contents however good the writing in it is. Cycling them gives
 * a page a rhythm: pictures, then a picture with the reporting stacked beside
 * it, then headlines in columns.
 *
 * The list lives here rather than beside the components that draw it because
 * those became client components — a block has to know what the reader has
 * read — and a server component importing a plain value out of a "use client"
 * module gets a reference to it, not the value. `SHAPES[i % SHAPES.length]`
 * quietly evaluated to undefined, and every desk block on every section front
 * rendered its heading and nothing under it.
 */
export const SHAPES = ["gallery", "split", "index"] as const;

export type Shape = (typeof SHAPES)[number];
