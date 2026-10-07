import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { registrationSchema } from "@/lib/validation";
import { makeRegistrationPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(req:NextRequest){
 try{
  const length=Number(req.headers.get("content-length")||0);if(length>1_500_000)return json({error:"The registration is too large. Please reduce your signature image and try again."},413);
  const rawText=await req.text();if(Buffer.byteLength(rawText,"utf8")>1_500_000)return json({error:"The registration is too large. Please reduce your signature image and try again."},413);const raw=JSON.parse(rawText);const parsed=registrationSchema.safeParse(raw?.data);if(!parsed.success)return json({error:"Please review the required registration information and try again."},400);if(!parsed.data.reviewed)return json({error:"Please confirm that you reviewed your registration before submitting."},400);
  const data=parsed.data,id=`DCNI-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,when=new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date());
  let pdf:Uint8Array;try{let logo:string|undefined;try{const image=await readFile(path.join(process.cwd(),"public","images","dcni-logo.png"));const compact=await sharp(image).resize({width:420,height:420,fit:"inside"}).jpeg({quality:76,mozjpeg:true}).toBuffer();logo=`data:image/jpeg;base64,${compact.toString("base64")}`;}catch{}pdf=makeRegistrationPdf(data,id,when,logo).output("arraybuffer") as unknown as Uint8Array;}catch{return json({error:"Your registration could not be converted into a PDF. Please try again."},500);}
  const filename=`DCNI-Pastor-Registration-${id}.pdf`,bytes=Buffer.from(pdf);if(raw?.action==="preview")return json({ok:true,id,when,filename,pdf:bytes.toString("base64")});const textBody=`A new pastor registration has been submitted through the DCNI Pastor Registration Portal.\n\nRegistration ID: ${id}\nPastor: ${data.fullName}\nCountry: ${data.country}\nSubmission Date: ${when}\n\nThe completed registration PDF is attached.`;
  const recipients=(process.env.WHATSAPP_RECIPIENT_NUMBERS||process.env.WHATSAPP_RECIPIENT_NUMBER||"").split(",").map(value=>value.trim().replace(/\D/g,"")).filter(Boolean);
  const emailConfigured=!!(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM&&process.env.REGISTRAR_EMAIL),waConfigured=!!(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&recipients.length);
  const emailTask=async()=>{if(!emailConfigured)return "not_configured";try{const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[process.env.REGISTRAR_EMAIL],subject:`New DCNI Pastor Registration - ${id}`,text:textBody,attachments:[{filename,content:bytes.toString("base64")} ]})});return response.ok?"accepted":"failed";}catch{return "failed";}};
  const waTask=async()=>{if(!waConfigured)return "not_configured";try{const version=process.env.WHATSAPP_GRAPH_API_VERSION||"v26.0",base=`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,auth={Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`};const form=new FormData();form.append("messaging_product","whatsapp");form.append("type","application/pdf");form.append("file",new Blob([bytes],{type:"application/pdf"}),filename);const upload=await fetch(`${base}/media`,{method:"POST",headers:auth,body:form});if(!upload.ok)return "failed";const media=await upload.json() as {id?:string};if(!media.id)return "failed";const outcomes=await Promise.all(recipients.map(async to=>{try{const sent=await fetch(`${base}/messages`,{method:"POST",headers:{...auth,"Content-Type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",to,type:"document",document:{id:media.id,filename,caption:`New DCNI Pastor Registration\nRegistration ID: ${id}\nPastor: ${data.fullName}\nCountry: ${data.country}\nSubmission Date: ${when}\nThe completed registration form is attached.`}})});return sent.ok;}catch{return false;}}));const accepted=outcomes.filter(Boolean).length;return accepted===outcomes.length?"accepted":accepted?"partial":"failed";}catch{return "failed";}};
  const [email,whatsapp]=await Promise.all([emailTask(),waTask()]);
  return json({ok:true,id,when,email,whatsapp,filename,pdf:bytes.toString("base64")});
 }catch{return json({error:"We could not process your registration. Please try again."},400);}
}
