-- ══════════════════════════════════════════════════════════
-- V3: Add implicit casts from varchar to custom enum types
-- Required for Hibernate compatibility: Hibernate sends enum
-- values as varchar; PostgreSQL custom types need explicit cast.
-- ══════════════════════════════════════════════════════════

CREATE CAST (varchar AS muscle_group)     WITH INOUT AS IMPLICIT;
CREATE CAST (varchar AS equipment_type)   WITH INOUT AS IMPLICIT;
CREATE CAST (varchar AS exercise_category) WITH INOUT AS IMPLICIT;
CREATE CAST (varchar AS set_type)         WITH INOUT AS IMPLICIT;
CREATE CAST (varchar AS weight_unit)      WITH INOUT AS IMPLICIT;
