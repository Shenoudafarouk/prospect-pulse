import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771823816139 implements MigrationInterface {
    name = 'InitialSchema1771823816139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tov_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255), "formality" double precision NOT NULL, "warmth" double precision NOT NULL, "directness" double precision NOT NULL, "humor" double precision, "technicality" double precision, "extra_params" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d7a8e4e57ae9b4599415174763" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sequence_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sequence_id" uuid NOT NULL, "step_number" integer NOT NULL, "channel" character varying(100) NOT NULL, "subject" character varying(500), "body" text NOT NULL, "signals_used" jsonb, "personalization_rationale" text, "assumptions" jsonb, "risk_checks" jsonb, "confidence_score" double precision, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60360d596f8e8a42c89063509b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_825e08e1d22532fb4ad7bad410" ON "sequence_messages" ("sequence_id") `);
        await queryRunner.query(`CREATE TYPE "public"."ai_generations_status_enum" AS ENUM('success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "ai_generations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sequence_id" uuid, "model" character varying(100) NOT NULL, "provider" character varying(100) NOT NULL, "prompt_version" character varying(50), "request_hash" character varying(64), "prompt_tokens" integer, "completion_tokens" integer, "total_tokens" integer, "estimated_cost" numeric(10,6), "latency_ms" integer, "status" "public"."ai_generations_status_enum" NOT NULL, "error_message" text, "request_payload" jsonb, "response_payload" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac39086528be836b5aac57d3896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b19f774d7dcba5a8ba4db6939a" ON "ai_generations" ("sequence_id") `);
        await queryRunner.query(`CREATE TYPE "public"."message_sequences_status_enum" AS ENUM('pending', 'generating', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "message_sequences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prospect_id" uuid NOT NULL, "tov_config_id" uuid NOT NULL, "company_context" text NOT NULL, "sequence_length" integer NOT NULL, "status" "public"."message_sequences_status_enum" NOT NULL DEFAULT 'pending', "prospect_analysis" jsonb, "overall_confidence" double precision, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ec3cf9e13bb3b727118b4bb6204" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6b6833ec5f6c95c84ab4380c3c" ON "message_sequences" ("prospect_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_21df7d0851a198cbd2b0a14279" ON "message_sequences" ("tov_config_id") `);
        await queryRunner.query(`CREATE TABLE "prospects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "linkedin_url" character varying(500) NOT NULL, "full_name" character varying(255) NOT NULL, "headline" character varying(500), "summary" text, "current_company" character varying(255), "current_title" character varying(255), "location" character varying(255), "profile_data" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9fc60d8f29db14b861e3c96568e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f9f666149d00e02d4c486f73b4" ON "prospects" ("linkedin_url") `);
        await queryRunner.query(`ALTER TABLE "sequence_messages" ADD CONSTRAINT "FK_825e08e1d22532fb4ad7bad4102" FOREIGN KEY ("sequence_id") REFERENCES "message_sequences"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_b19f774d7dcba5a8ba4db6939a4" FOREIGN KEY ("sequence_id") REFERENCES "message_sequences"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_sequences" ADD CONSTRAINT "FK_6b6833ec5f6c95c84ab4380c3cd" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_sequences" ADD CONSTRAINT "FK_21df7d0851a198cbd2b0a14279e" FOREIGN KEY ("tov_config_id") REFERENCES "tov_configs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_sequences" DROP CONSTRAINT "FK_21df7d0851a198cbd2b0a14279e"`);
        await queryRunner.query(`ALTER TABLE "message_sequences" DROP CONSTRAINT "FK_6b6833ec5f6c95c84ab4380c3cd"`);
        await queryRunner.query(`ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_b19f774d7dcba5a8ba4db6939a4"`);
        await queryRunner.query(`ALTER TABLE "sequence_messages" DROP CONSTRAINT "FK_825e08e1d22532fb4ad7bad4102"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f9f666149d00e02d4c486f73b4"`);
        await queryRunner.query(`DROP TABLE "prospects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21df7d0851a198cbd2b0a14279"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b6833ec5f6c95c84ab4380c3c"`);
        await queryRunner.query(`DROP TABLE "message_sequences"`);
        await queryRunner.query(`DROP TYPE "public"."message_sequences_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b19f774d7dcba5a8ba4db6939a"`);
        await queryRunner.query(`DROP TABLE "ai_generations"`);
        await queryRunner.query(`DROP TYPE "public"."ai_generations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_825e08e1d22532fb4ad7bad410"`);
        await queryRunner.query(`DROP TABLE "sequence_messages"`);
        await queryRunner.query(`DROP TABLE "tov_configs"`);
    }

}
