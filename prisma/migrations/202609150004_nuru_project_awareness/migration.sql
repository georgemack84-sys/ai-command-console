ALTER TABLE "NuruKnowledgeItem" ADD COLUMN "relatedProjects" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "NuruContextAssessment" ADD COLUMN "relatedProjects" JSONB NOT NULL DEFAULT '[]';
