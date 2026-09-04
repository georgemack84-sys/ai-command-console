import { LINUX_SKILL_GRAPH_EDGES, LINUX_SKILL_GRAPH_NODES } from "@/services/learning-constitution";
import { PrismaSkillGraphRepository } from "./prisma-skill-graph-repository";
export async function ensureLinuxSkillGraphSeeded() { const repository = new PrismaSkillGraphRepository(); for (const node of LINUX_SKILL_GRAPH_NODES) await repository.createNode(node); for (const edge of LINUX_SKILL_GRAPH_EDGES) await repository.createEdge(edge); return repository; }
