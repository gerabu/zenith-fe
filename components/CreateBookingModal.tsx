"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
// zod 4 implements the Standard Schema spec; the standard-schema resolver
// avoids the zod-version typing skew in `@hookform/resolvers/zod`.
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { AlertCircleIcon, Plus } from "lucide-react";

import { createBooking } from "@/app/bookings/actions";
import {
  bookingFormSchema,
  type BookingFormValues,
} from "@/app/bookings/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zonedWallTimeToISO } from "@/lib/timezone";

/**
 * Reusable Create Booking modal. The trigger is disabled until the viewer's
 * Google Calendar is connected (ADR-001 "optional but blocking", ADR-002
 * read-only state). `timeZone` is the viewer's IANA zone, used to convert the
 * wall-clock inputs to UTC before submitting.
 */
export function CreateBookingModal({
  calendarConnected,
  timeZone,
}: {
  calendarConnected: boolean;
  timeZone: string;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: standardSchemaResolver(bookingFormSchema),
    defaultValues: { title: "", date: "", startTime: "", endTime: "" },
  });

  function closeAndReset(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setServerError(null);
    }
  }

  async function onSubmit(values: BookingFormValues) {
    setServerError(null);
    // Combine the shared date with each time into a wall-clock instant, then
    // convert to UTC here, in the viewer's zone — the server action must receive
    // ISO timestamps, not zoneless strings.
    const result = await createBooking({
      title: values.title,
      startTime: zonedWallTimeToISO(`${values.date}T${values.startTime}`, timeZone),
      endTime: zonedWallTimeToISO(`${values.date}T${values.endTime}`, timeZone),
    });

    if (result.success) {
      closeAndReset(false);
    } else {
      setServerError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogTrigger
        render={<Button size="sm" disabled={!calendarConnected} />}
      >
        <Plus />
        New booking
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Reserve a time slot. We&apos;ll check your calendar for conflicts
            before confirming.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Couldn&apos;t create booking</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="booking-title">Title</Label>
            <Input
              id="booking-title"
              placeholder="Design review"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-date">Date</Label>
            <Input
              id="booking-date"
              type="date"
              aria-invalid={!!errors.date}
              {...register("date")}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="booking-start">Start</Label>
              <Input
                id="booking-start"
                type="time"
                aria-invalid={!!errors.startTime}
                {...register("startTime")}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="booking-end">End</Label>
              <Input
                id="booking-end"
                type="time"
                aria-invalid={!!errors.endTime}
                {...register("endTime")}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeAndReset(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
