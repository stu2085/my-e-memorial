import FormSection from "./FormSection";
import Input from "./Input";
import TextArea from "./TextArea";
import GraveLocationMap from "./GraveLocationMap";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleDispositionChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  handleCenterMap: () => void;
  handleUseCurrentLocation: () => void;
  mapSearchStatus: string;
  locationStatus: string;
  setForm: React.Dispatch<React.SetStateAction<any>>;
};

export default function FinalRestingPlaceSection({
  form,
  handleChange,
  handleDispositionChange,
  handleCenterMap,
  handleUseCurrentLocation,
  mapSearchStatus,
  locationStatus,
  setForm,
}: Props) {
  return (
    <FormSection
      title="Final Resting Place"
      description="Tell visitors whether this person was buried or cremated. If known, you can also add a map location."
    >
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-800">
            Was this person buried or cremated?
          </label>

          <select
            name="finalRestingType"
            value={form.finalRestingType}
            onChange={handleDispositionChange}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          >
            <option value="">Not specified</option>
            <option value="buried">Buried</option>
            <option value="cremated">Cremated</option>
          </select>
        </div>

        {form.finalRestingType === "buried" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Cemetery Name"
              name="cemeteryName"
              value={form.cemeteryName}
              onChange={handleChange}
            />

            <Input
              label="Section"
              name="graveSection"
              value={form.graveSection}
              onChange={handleChange}
            />

            <Input
              label="Row"
              name="graveRow"
              value={form.graveRow}
              onChange={handleChange}
            />

            <Input
              label="Plot / Lot / Grave"
              name="gravePlot"
              value={form.gravePlot}
              onChange={handleChange}
            />
          </div>
        )}

        {form.finalRestingType === "cremated" && (
          <TextArea
            label="Where were the ashes scattered or placed?"
            name="ashesLocationDescription"
            value={form.ashesLocationDescription}
            onChange={handleChange}
            rows={4}
            helpText="Example: Ashes were scattered at the family farm in Lancaster County, Pennsylvania."
          />
        )}

        {(form.finalRestingType === "buried" ||
          form.finalRestingType === "cremated") && (
          <div className="border-t border-stone-200 pt-6">
            <h3 className="text-xl font-semibold text-stone-900">
              Map Location
            </h3>

            <p className="mt-2 text-sm text-stone-600">
              {form.finalRestingType === "buried"
                ? "You may place a pin at the burial location"
                : "You may enter an address or place a pin at grave location or where the ashes were scattered, kept, or memorialized."}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Street Address"
                name="mapStreet"
                value={form.mapStreet}
                onChange={handleChange}
              />

              <Input
                label="City"
                name="mapCity"
                value={form.mapCity}
                onChange={handleChange}
              />

              <Input
                label="State"
                name="mapState"
                value={form.mapState}
                onChange={handleChange}
              />

              <Input
                label="ZIP Code"
                name="mapZip"
                value={form.mapZip}
                onChange={handleChange}
              />

              <Input
                label="Country"
                name="mapCountry"
                value={form.mapCountry}
                onChange={handleChange}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCenterMap}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Center Map
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Use My Current Location
              </button>
            </div>

            {mapSearchStatus && (
              <p className="mt-3 text-sm text-stone-500">
                {mapSearchStatus}
              </p>
            )}

            {locationStatus && (
              <p className="mt-3 text-sm text-stone-500">
                {locationStatus}
              </p>
            )}

            <div className="mt-4 overflow-hidden rounded-2xl">
              <GraveLocationMap
                key={`${form.graveLat || "none"}-${form.graveLng || "none"}-edit`}
                lat={form.graveLat ? Number(form.graveLat) : null}
                lng={form.graveLng ? Number(form.graveLng) : null}
                readOnly={false}
                height="420px"
                onChange={(lat, lng) =>
                  setForm((prev: any) => ({
                    ...prev,
                    graveLat: String(lat),
                    graveLng: String(lng),
                  }))
                }
              />
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <Input
                label="Latitude"
                name="graveLat"
                value={form.graveLat}
                onChange={handleChange}
              />

              <Input
                label="Longitude"
                name="graveLng"
                value={form.graveLng}
                onChange={handleChange}
              />
            </div>

            <div className="mt-5">
              <TextArea
                label={
                  form.finalRestingType === "buried"
                    ? "Directions Note"
                    : "Location Note"
                }
                name="graveDirections"
                value={form.graveDirections}
                onChange={handleChange}
                rows={4}
                helpText={
                  form.finalRestingType === "buried"
                    ? "Example: Near the large oak tree, third row from the chapel side"
                    : "Example: Overlook above the lake near the family cabin"
                }
              />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}