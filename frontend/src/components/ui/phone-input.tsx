import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input, InputProps } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import "react-phone-number-input/style.css"

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> &
  Omit<React.ComponentProps<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void
  }

const PhoneInput = React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <RPNInput.default
        ref={ref}
        className={cn("flex", className)}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        onChange={(value) => onChange?.(value || "")}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      className={cn("rounded-e-md rounded-s-none", className)}
      {...props}
      ref={ref}
    />
  )
)
InputComponent.displayName = "InputComponent"

const searchAliases: Record<string, string> = {
  US: "United States USA America",
  GB: "United Kingdom Great Britain England UK",
  AE: "United Arab Emirates UAE",
  EG: "Egypt Misr",
  SA: "Saudi Arabia KSA",
  FR: "France French",
  DE: "Germany Deutschland",
  IT: "Italy Italia",
  ES: "Spain Espana",
  IN: "India Bharat",
  CN: "China PRC",
  JP: "Japan Nippon",
}

type CountrySelectOption = { label: string; value: RPNInput.Country; icon: React.ComponentType<{ title: string }> }

type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  onChange: (value: RPNInput.Country) => void
  options: CountrySelectOption[]
}

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange(country)
    },
    [onChange]
  )

  return (
    <Popover modal={true}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "flex gap-1 rounded-e-none rounded-s-md px-3",
          disabled ? "opacity-50" : ""
        )}
        disabled={disabled}
      >
        <FlagComponent country={value} countryName={value} />
        <ChevronsUpDown
          className={cn(
            "-mr-2 h-4 w-4 opacity-50",
            disabled ? "hidden" : "opacity-100"
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-[300px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search country..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((x) => x.value)
                .map((option) => (
                  <CommandItem
                    className="gap-2"
                    key={option.value}
                    value={`${option.label} ${searchAliases[option.value] || ""}`}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <FlagComponent
                      country={option.value}
                      countryName={option.label}
                    />
                    <span className="flex-1 text-sm">{option.label}</span>
                    {option.value && (
                      <span className="text-foreground/50 text-sm">
                        {`+${RPNInput.getCountryCallingCode(option.value)}`}
                      </span>
                    )}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        option.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FlagComponent = ({ country, countryName }: { country: RPNInput.Country; countryName: string }) => {
  const Flag = flags[country]

  return (
    <span className="flex h-3 w-4 shrink-0 [&_svg]:h-full [&_svg]:w-full [&_svg]:object-contain">
      {Flag && <Flag title={countryName} />}
    </span>
  )
}
FlagComponent.displayName = "FlagComponent"

export { PhoneInput }
