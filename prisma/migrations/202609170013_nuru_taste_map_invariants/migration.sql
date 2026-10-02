ALTER TABLE "NuruTasteInterviewResponse"
  ADD CONSTRAINT "NuruTasteInterviewResponse_answer_length_check"
  CHECK (char_length(btrim("answer")) >= 3);

ALTER TABLE "NuruTasteProfileSignal"
  ADD CONSTRAINT "NuruTasteProfileSignal_polarity_check"
  CHECK ("polarity" IN (-1, 1)),
  ADD CONSTRAINT "NuruTasteProfileSignal_confidence_check"
  CHECK ("confidence" >= 0 AND "confidence" <= 1),
  ADD CONSTRAINT "NuruTasteProfileSignal_evidenceCount_check"
  CHECK ("evidenceCount" >= 0);

ALTER TABLE "NuruTasteEvidence"
  ADD CONSTRAINT "NuruTasteEvidence_weight_check"
  CHECK ("weight" >= -1 AND "weight" <= 1);

ALTER TABLE "NuruDiscoverInterestSignal"
  ADD CONSTRAINT "NuruDiscoverInterestSignal_reasonCode_check"
  CHECK ("reasonCode" IS NULL OR "reasonCode" IN (
    'SUBJECT', 'STORY', 'PERSON', 'PROCESS', 'IDEAS', 'CONNECTION',
    'ALREADY_KNEW', 'TOO_SIMILAR', 'WRONG_SUBJECT', 'TOO_TECHNICAL',
    'NOT_DEEP_ENOUGH', 'WRONG_FORMAT', 'NOT_INTERESTED'
  ));
