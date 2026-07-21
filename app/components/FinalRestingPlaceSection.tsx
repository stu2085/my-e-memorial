"use client";

import FormSection from "./FormSection";
import Input from "./Input";
import TextArea from "./TextArea";
import dynamic from "next/dynamic";

const GraveLocationMap = dynamic(() => import("./GraveLocationMap"), {
  ssr: false,
});

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

             <div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    State
  </label>

  <select
    name="mapState"
    value={form.mapState}
    onChange={handleChange}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
  >
    <option value="">Select state</option>
    <option value="AL">AL</option>
    <option value="AK">AK</option>
    <option value="AZ">AZ</option>
    <option value="AR">AR</option>
    <option value="CA">CA</option>
    <option value="CO">CO</option>
    <option value="CT">CT</option>
    <option value="DE">DE</option>
    <option value="FL">FL</option>
    <option value="GA">GA</option>
    <option value="HI">HI</option>
    <option value="ID">ID</option>
    <option value="IL">IL</option>
    <option value="IN">IN</option>
    <option value="IA">IA</option>
    <option value="KS">KS</option>
    <option value="KY">KY</option>
    <option value="LA">LA</option>
    <option value="ME">ME</option>
    <option value="MD">MD</option>
    <option value="MA">MA</option>
    <option value="MI">MI</option>
    <option value="MN">MN</option>
    <option value="MS">MS</option>
    <option value="MO">MO</option>
    <option value="MT">MT</option>
    <option value="NE">NE</option>
    <option value="NV">NV</option>
    <option value="NH">NH</option>
    <option value="NJ">NJ</option>
    <option value="NM">NM</option>
    <option value="NY">NY</option>
    <option value="NC">NC</option>
    <option value="ND">ND</option>
    <option value="OH">OH</option>
    <option value="OK">OK</option>
    <option value="OR">OR</option>
    <option value="PA">PA</option>
    <option value="RI">RI</option>
    <option value="SC">SC</option>
    <option value="SD">SD</option>
    <option value="TN">TN</option>
    <option value="TX">TX</option>
    <option value="UT">UT</option>
    <option value="VT">VT</option>
    <option value="VA">VA</option>
    <option value="WA">WA</option>
    <option value="WV">WV</option>
    <option value="WI">WI</option>
    <option value="WY">WY</option>
  </select>
</div>

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