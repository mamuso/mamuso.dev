import { CARTRIDGES } from "@/data/cartridges";

export function CartridgeFallback() {
  return (
    <section className="flex h-full items-center justify-center px-6 text-center">
      <div>
        <h2 className="text-balance text-base font-semibold">Career cartridges</h2>
        <p className="mt-2 text-sm text-neutral-600">
          A collection representing work with these teams:
        </p>
        <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {CARTRIDGES.map((cartridge) => (
            <li key={cartridge.label}>{cartridge.name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
