import Medicine from "../models/Medicine.js";
import { norm } from "./cart.js";

// Connects each medicine line of a prescription to the store product it means, so "Buy medicines" and the
// prescription-only check use the product's ID instead of guessing from a name.
//   1. The line already carries a store ID (the doctor picked it from the autocomplete) -> use it.
//   2. Otherwise, if the typed name matches a store product exactly (ignoring capital letters) -> use that.
//   3. Otherwise the medicine is not in the store: keep it as plain text, with no ID.
// A linked line always gets the store's own spelling of the name, so the ID and the name never disagree.
export async function linkToStore(medicines) {
  const products = await Medicine.find().select("name");
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const byName = new Map(products.map((p) => [norm(p.name), p]));

  return medicines.map(({ medicine, ...line }) => {
    const product = (medicine && byId.get(String(medicine))) || byName.get(norm(line.name));
    return product ? { ...line, name: product.name, medicine: product._id } : line;
  });
}
