import { DisplayFilterSchema, DisplayInputSchema } from 'schema/display/input'
import { makeFunctionWithAPIColumn, makeFunctionWithAPICell } from 'schema/shared'
import { z, ZodType } from 'zod'

// maps literal -> schema
export const ValueSchemaMapping = {
  string: [z.literal('string'), z.string()],
  date: [z.literal('date'), z.date()],
  number: [z.literal('number'), z.number()],
  boolean: [z.literal('boolean'), z.boolean()],
  'string[]': [z.literal('string[]'), z.array(z.string())],
  'date[]': [z.literal('date[]'), z.array(z.date())],
  'number[]': [z.literal('number[]'), z.array(z.number())],
  'boolean[]': [z.literal('boolean[]'), z.array(z.boolean())],
} as const

function makeConfigItemColumnSchema<V extends ZodType, L extends ZodType, B extends ZodType, F extends ZodType>(
  cellValueSchema: V,
  configType: L,
  configValue: B,
) {
  return z.object({
    /** type of value of the config, ex: string, string[], number, etc */
    type: configType,
    /** optionally, specify how to parse the raw value the user enters through the form.
     * If not provided, the default logic would try to best effort cast the raw input to the provided value type
     */
    parse: makeFunctionWithAPIColumn(cellValueSchema, configValue).optional(),
    /**
     * the filtering logic
     */
    logic: makeFunctionWithAPICell(cellValueSchema, z.boolean(), configValue), // for filter
  })
}
export function makeFilterSchema<V extends ZodType>(cellValueSchema: V) {
  // filter input has specific behavior so we need to separate them from say input rendered in cells
  const form = z.union([makeFunctionWithAPIColumn(cellValueSchema, DisplayFilterSchema), DisplayFilterSchema])
  return z
    .discriminatedUnion('type', [
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['boolean']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['string']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['date']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['number']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['string[]']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['number[]']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['boolean[]']),
      makeConfigItemColumnSchema(cellValueSchema, ...ValueSchemaMapping['date[]']),
    ])
    .and(
      z.object({
        label: z.string(),
        info: z.string().optional(),
        form,
      }),
    )
}

/**
 * config is defined at the column level, then distributed using config
 */
export function makeConfigSchema<V extends ZodType>(valueSchema: V) {
  const form = z.union([makeFunctionWithAPIColumn(valueSchema, DisplayInputSchema), DisplayInputSchema])

  return z
    .discriminatedUnion('type', [
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['boolean']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['string']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['date']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['number']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['string[]']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['number[]']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['date[]']).omit({
        logic: true,
      }),
      makeConfigItemColumnSchema(z.never(), ...ValueSchemaMapping['boolean[]']).omit({
        logic: true,
      }),
    ])
    .and(
      z.object({
        label: z.string(),
        info: z.string().optional(),
        form,
      }),
    )
}
