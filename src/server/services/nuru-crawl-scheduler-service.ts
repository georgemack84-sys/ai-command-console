import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
type Model={upsert(args:unknown):Promise<unknown>;findMany(args:unknown):Promise<unknown[]>};
const jobs=(nuruKnowledgeRepository as unknown as {nuruCrawlScheduleJob:Model}).nuruCrawlScheduleJob;
const interval:Record<string,number>={HOURLY:3600000,DAILY:86400000,WEEKLY:604800000,MONTHLY:2592000000,ON_DEMAND:Number.POSITIVE_INFINITY};
/** Creates reviewable retrieval jobs only; no network fetch occurs in this service. */
export const NuruCrawlSchedulerService={
 async schedule(workspaceId:string,actor:string,correlationId:string,now=new Date()) {
  const entries=await (nuruKnowledgeRepository as unknown as {nuruUrlFrontierEntry:{findMany(args:unknown):Promise<Array<Record<string,unknown>>>}}).nuruUrlFrontierEntry.findMany({where:{workspaceId,status:"QUEUED"},orderBy:{priority:"desc"}});
  let scheduled=0; for(const entry of entries){ const source=await nuruKnowledgeRepository.nuruSourceRegistry.findUnique({where:{id:String(entry.sourceRegistryId)}}) as Record<string,unknown>|null; if(!source||source.workspaceId!==workspaceId||!source.enabled||source.operationalState==="PAUSED"||!["APPROVED","LIMITED"].includes(String(source.admissionState))||!Array.isArray(source.ingestionMethods)||!source.ingestionMethods.includes("WEB")) continue; const cadence=String(source.refreshPolicy); if(cadence==="ON_DEMAND") continue; const last=entry.lastFetchedAt instanceof Date?entry.lastFetchedAt:null; const dueAt=last?new Date(last.getTime()+(interval[cadence]??interval.DAILY)):now; if(dueAt>now) continue; await jobs.upsert({where:{frontierEntryId:String(entry.id)},create:{id:`NSI-CRAWL-${crypto.randomUUID().replaceAll("-","").slice(0,16).toUpperCase()}`,workspaceId,frontierEntryId:String(entry.id),sourceRegistryId:String(entry.sourceRegistryId),cadence,status:"SCHEDULED",dueAt,scheduledBy:actor},update:{cadence,status:"SCHEDULED",dueAt,scheduledBy:actor}}); scheduled++; }
  await NuruAuditService.record({operation:"DISCOVERY_CREATED",actor,resourceId:`crawl-schedule:${workspaceId}`,outputReference:String(scheduled),decision:"SCHEDULED",reason:"Created controlled retrieval jobs only; no source was fetched.",correlationId}); return {scheduled};
 },
 async list(workspaceId:string){return jobs.findMany({where:{workspaceId},orderBy:{dueAt:"asc"}});}
};
