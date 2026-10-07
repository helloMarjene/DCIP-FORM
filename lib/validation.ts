import { z } from "zod";

const text = z.string().trim().max(2000, "Please keep this answer under 2,000 characters.").default("");
export const registrationSchema = z.object({
  firstName:text,lastName:text,middleName:text,fullName:text,preferredName:text,title:text,gender:text,dateOfBirth:text,nationality:text,country:text,region:text,district:text,city:text,address:text,postalCode:text,
  primaryEmail:text,contactEmail:text,phone:text,whatsapp:text,altPhone:text,
  churchName:text,churchFounded:text,churchAddress:text,churchCity:text,churchRegion:text,churchDistrict:text,churchPostal:text,churchEmail:text,churchPhone:text,churchWebsite:text,languages:text,existingMember:text,renewalFee:text,
  position:text,yearsMinistry:text,ordained:text,ordinationDate:text,ordainingOrg:text,ordainingMinister:text,denomination:text,ministryLocation:text,ministryCountry:text,ministryRegion:text,ministryCity:text,ministryActivities:text,ministryOther:text,
  joinedDate:text,attendedPrograms:text,programs:text,programDate:text,discovery:text,discoveryOther:text,recommendedBy:text,affiliated:text,interests:text,contributions:text,membershipStatus:text,previousInfo:text,
  declarationName:text,declarationDate:text,confirmed:z.boolean().default(false),reviewed:z.boolean().default(false),signature:z.string().max(350_000,"Please clear the signature and sign again.").default(""),
}).superRefine((v,ctx)=>{
  for(const [k,label] of [["fullName","Full name"],["primaryEmail","Primary email"],["phone","Primary phone number"],["country","Country of residence"],["churchName","Church organization name"]] as const){if(!v[k]?.trim())ctx.addIssue({code:"custom",path:[k],message:`${label} is required.`});}
  if(v.primaryEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.primaryEmail))ctx.addIssue({code:"custom",path:["primaryEmail"],message:"Please enter a valid email address."});
  if(v.churchEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.churchEmail))ctx.addIssue({code:"custom",path:["churchEmail"],message:"Please enter a valid email address."});
  const phonePattern=/^\+?[0-9\s().-]{7,30}$/;
  for(const key of ["phone","whatsapp","altPhone"] as const){if(v[key]&&!phonePattern.test(v[key]))ctx.addIssue({code:"custom",path:[key],message:"Please enter a valid phone number, including country code where available."});}
  if(!v.declarationName?.trim())ctx.addIssue({code:"custom",path:["declarationName"],message:"Please enter your full name."});
  if(!v.declarationDate?.trim())ctx.addIssue({code:"custom",path:["declarationDate"],message:"Please enter the declaration date."});
  for(const key of ["dateOfBirth","churchFounded","ordinationDate","joinedDate","programDate","declarationDate"] as const){const date=v[key];if(date){const parsed=new Date(`${date}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(parsed.valueOf())||parsed.toISOString().slice(0,10)!==date)ctx.addIssue({code:"custom",path:[key],message:"Please enter a valid date."});}}
  if(!v.confirmed)ctx.addIssue({code:"custom",path:["confirmed"],message:"Please confirm your declaration."});
  if(!v.signature)ctx.addIssue({code:"custom",path:["signature"],message:"Please draw and save your signature."});
});
export type Registration = z.infer<typeof registrationSchema>;
export type RegistrationInput = z.input<typeof registrationSchema>;
