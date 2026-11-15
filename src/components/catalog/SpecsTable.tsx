import React from 'react'
import type { VehicleSpecs, Dimensions } from '@/types/vehicle'

interface SpecsTableProps {
  specs: VehicleSpecs
}

const specSections = [
  {
    title: 'Performance',
    items: [
      { label: 'Engine', key: 'engine' },
      { label: 'Power', key: 'power' },
      { label: 'Torque', key: 'torque' },
      { label: 'Transmission', key: 'transmission' },
      { label: 'Drivetrain', key: 'drivetrain' },
      { label: '0-60 mph', key: 'acceleration' },
      { label: 'Top Speed', key: 'topSpeed' },
    ] as const,
  },
  {
    title: 'Efficiency',
    items: [
      { label: 'Fuel Economy', key: 'fuelEconomy' },
    ] as const,
  },
  {
    title: 'Dimensions',
    items: [
      { label: 'Length', key: 'length' },
      { label: 'Width', key: 'width' },
      { label: 'Height', key: 'height' },
      { label: 'Wheelbase', key: 'wheelbase' },
      { label: 'Weight', key: 'weight' },
    ] as const,
  },
] as const

function SpecSection({ title, items, specs }: { title: string; items: readonly { label: string; key: keyof VehicleSpecs | keyof Dimensions }[]; specs: VehicleSpecs }) {
  return (
    <thead>
      <tr>
        <th colSpan={2} className="text-left text-sm font-semibold text-porsche-red uppercase tracking-wider pb-3 pt-6 border-t border-porsche-chalk first:pt-0 first:border-none">
          {title}
        </th>
      </tr>
      {items.map((item) => (
        <tr key={item.key} className="border-b border-porsche-chalk/50 last:border-none">
          <th scope="row" className="text-left py-3 text-porsche-black/60 font-medium">
            {item.label}
          </th>
          <td className="text-right py-3 text-porsche-black font-medium tabular-nums">
            {item.key in specs.dimensions
              ? String((specs.dimensions as Dimensions)[item.key as keyof Dimensions])
              : String((specs as VehicleSpecs)[item.key as keyof VehicleSpecs])}
          </td>
        </tr>
      ))}
    </thead>
  )
}

export function SpecsTable({ specs }: SpecsTableProps) {
  return (
    <section aria-labelledby="specs-heading" className="py-8">
      <h2 id="specs-heading" className="text-2xl font-bold text-porsche-black mb-6">
        Specifications
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          {specSections.map((section) => (
            <SpecSection key={section.title} {...section} specs={specs} />
          ))}
        </table>
      </div>
    </section>
  )
}