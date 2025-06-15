import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenName(fullName: string, maxLength: number = 18): string {
  if (typeof fullName !== 'string' || !fullName.trim()) {
    return ''; // Or return fullName if preferred for non-string inputs
  }
  const trimmedFullName = fullName.trim();
  if (trimmedFullName.length <= maxLength) {
    return trimmedFullName;
  }

  const nameParts = trimmedFullName.split(' ').filter(part => part.length > 0);

  if (nameParts.length > 1) {
    // Try "Firstname L."
    const firstPart = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    let shortened = `${firstPart} ${lastInitial}.`;

    if (shortened.length <= maxLength) {
      return shortened;
    }

    // If "Firstname L." is still too long, try "F. Lastname" if last name is shorter
    // (This part can get complex, let's try a simpler "F. L." first)

    // Try "F. L." if first name is also long
    if (firstPart.length > 1) {
         const firstInitial = firstPart.charAt(0);
         const veryShortened = `${firstInitial}. ${lastInitial}.`;
         if (veryShortened.length <= maxLength) {
             return veryShortened;
         }
    }

    // If "Firstname L." was too long, and "F.L." is too short or not preferred,
    // truncate "Firstname" part of "Firstname L."
    const remainingLengthForFirstName = maxLength - 3; // for " L."
    if (remainingLengthForFirstName > 0) {
        return `${firstPart.substring(0, remainingLengthForFirstName)}... ${lastInitial}.`;
    } else {
        // Fallback if even first name part is too small with last initial
         return trimmedFullName.substring(0, maxLength - 3) + '...';
    }

  } else if (nameParts.length === 1) {
    // Single very long name
    return `${nameParts[0].substring(0, maxLength - 3)}...`;
  }

  // Default fallback if other conditions didn't catch (e.g. empty string after split)
  return trimmedFullName.substring(0, maxLength - 3) + '...';
}
