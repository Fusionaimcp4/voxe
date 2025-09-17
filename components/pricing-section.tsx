"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function PricingSection() {
  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-8 md:py-14">
      <div className="self-stretch relative flex flex-col justify-center items-center gap-2 py-0">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            Get an instant estimate based on your support needs
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-tight">
            Discover your ROI and see how a one-time setup fee can replace recurring per-seat costs forever.
          </p>
        </div>
      </div>
      <div className="self-stretch px-5 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 mt-10 max-w-[900px] mx-auto">
        <Card className="flex-1 w-full">
          <CardHeader>
            <CardTitle>Estimate your setup cost</CardTitle>
            <CardDescription>
              Get an estimated one-time cost—based on your team size, expected resolution
              volume, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/cost-savings">
              <Button variant="link" className="p-0">
                Calculate costs
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex-1 w-full">
          <CardHeader>
            <CardTitle>See how much you could save</CardTitle>
            <CardDescription>
              Estimate how much you could save by switching from expensive, per-seat SaaS tools like Intercom or
              Zendesk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/cost-savings">
              <Button variant="link" className="p-0">
                Calculate savings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
