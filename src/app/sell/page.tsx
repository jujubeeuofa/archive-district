import { requireUser } from "@/lib/session";
import { submitSellForm } from "./actions";
import PhotoUpload from "@/components/PhotoUpload";

export default async function SellPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-display uppercase text-bone">Sell to us</h1>
      <p className="mt-1 text-sm text-ink-300">
        Submit your item for review. We&apos;ll follow up with an offer — track status and
        message us from your account.
      </p>

      <form action={submitSellForm} className="card mt-6 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="brand">
              Brand
            </label>
            <input className="input" id="brand" name="brand" required placeholder="Chrome Hearts" />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <input className="input" id="category" name="category" required placeholder="Rings" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="title">
            Item title
          </label>
          <input
            className="input"
            id="title"
            name="title"
            required
            placeholder="CH Cross Ring, Size 9"
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            className="input min-h-28"
            id="description"
            name="description"
            required
            placeholder="Condition, purchase year, any flaws, includes original packaging?"
          />
        </div>

        <div>
          <label className="label" htmlFor="askingPrice">
            Asking price (optional)
          </label>
          <input
            className="input"
            id="askingPrice"
            name="askingPrice"
            type="number"
            min="0"
            step="1"
            placeholder="500"
          />
        </div>

        <PhotoUpload name="photos" maxPhotos={6} />

        <button type="submit" className="btn-primary w-full">
          Submit for review
        </button>
      </form>
    </div>
  );
}
