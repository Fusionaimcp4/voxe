import Image from "next/image"
import { SECTION_HEADING, SECTION_SUBHEAD, NEW_TESTIMONIALS, type Testimonial } from "@/data/testimonials"

type TestimonialWithType = Testimonial & { type: string }

const testimonials: TestimonialWithType[] = NEW_TESTIMONIALS.map((testimonial, index) => {
  let type = "small-dark"
  if (index === 0) type = "large-teal"
  if (index === 6) type = "large-light" // The 7th testimonial
  return { ...testimonial, type }
})

const TestimonialCard = ({ quote, name, company, title, avatar, alt, type }: TestimonialWithType) => {
  const isLargeCard = type.startsWith("large")
  const avatarSize = isLargeCard ? 48 : 36
  const avatarBorderRadius = isLargeCard ? "rounded-[41px]" : "rounded-[30.75px]"
  const padding = isLargeCard ? "p-6" : "p-[30px]"

  let cardClasses = `flex flex-col justify-between items-start overflow-hidden rounded-[10px] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] relative ${padding}`
  let quoteClasses = ""
  let nameClasses = ""
  let companyClasses = ""
  let backgroundElements = null
  let cardHeight = ""
  const cardWidth = "w-full md:w-[384px]"

  if (type === "large-teal") {
    cardClasses += " bg-gradient-to-br from-emerald-500 to-teal-600"
    quoteClasses += " text-white text-2xl font-medium leading-8"
    nameClasses += " text-white text-base font-semibold leading-6"
    companyClasses += " text-white/80 text-base font-normal leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/large-card-background.svg')", zIndex: 0 }}
      />
    )
  } else if (type === "large-light") {
    cardClasses += " bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
    quoteClasses += " text-slate-900 dark:text-white text-2xl font-medium leading-8"
    nameClasses += " text-slate-900 dark:text-white text-base font-semibold leading-6"
    companyClasses += " text-slate-600 dark:text-slate-300 text-base font-normal leading-6"
    cardHeight = "h-[502px]"
    backgroundElements = (
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/images/large-card-background.svg')", zIndex: 0 }}
      />
    )
  } else {
    cardClasses += " bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
    quoteClasses += " text-slate-900 dark:text-white text-[17px] font-normal leading-6"
    nameClasses += " text-slate-900 dark:text-white text-sm font-semibold leading-[22px]"
    companyClasses += " text-slate-600 dark:text-slate-300 text-sm font-normal leading-[22px]"
    cardHeight = "h-[244px]"
  }

  return (
    <div className={`${cardClasses} ${cardWidth} ${cardHeight}`}>
      {backgroundElements}
      <div className={`relative z-10 font-normal break-words ${quoteClasses}`}>{quote}</div>
      <div className="relative z-10 flex justify-start items-center gap-3">
        <Image
          src={avatar || "/placeholder-user.jpg"}
          alt={alt || `${name} avatar`}
          width={avatarSize}
          height={avatarSize}
          className={`object-cover w-${avatarSize / 4} h-${avatarSize / 4} ${avatarBorderRadius}`}
          style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
        />
        <div className="flex flex-col justify-start items-start gap-0.5">
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>
            {title && `${title}, `}
            {company}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialGridSection() {
  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14 bg-white dark:bg-slate-900">
      <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-slate-900 dark:text-white text-3xl md:text-4xl lg:text-[40px] font-bold leading-tight md:leading-tight lg:leading-[40px]">
            {SECTION_HEADING}
          </h2>
          <p className="self-stretch text-center text-slate-700 dark:text-slate-300 text-base md:text-base lg:text-lg font-medium leading-[18.20px] md:leading-relaxed lg:leading-relaxed max-w-3xl">
            {SECTION_SUBHEAD}
          </p>
        </div>
      </div>
      <div className="w-full pt-0.5 pb-4 md:pb-6 lg:pb-10 flex flex-col md:flex-row justify-center items-start gap-4 md:gap-4 lg:gap-6 max-w-[1100px] mx-auto">
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
          {/* The grid supports 8 testimonials, so we can add the last one here if needed */}
          {testimonials[7] && <TestimonialCard {...testimonials[7]} />}
        </div>
      </div>
    </section>
  )
}
