class KycValidationService:
    def validate(self, extracted_fields: dict, document_type: str) -> dict:
        return {
            "format_valid": None,
            "name_match_score": None,
            "quality_flags": [],
            "review_recommended": True,
        }
