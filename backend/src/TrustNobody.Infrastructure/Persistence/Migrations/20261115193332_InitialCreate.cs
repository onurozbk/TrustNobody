using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrustNobody.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    username = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    normalized_username = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "games",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    phase = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    round = table.Column<int>(type: "integer", nullable: false),
                    phase_ends_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    winner = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ended_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    settings_discussion_seconds = table.Column<int>(type: "integer", nullable: false),
                    settings_doctor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    settings_max_players = table.Column<int>(type: "integer", nullable: false),
                    settings_night_seconds = table.Column<int>(type: "integer", nullable: false),
                    settings_reveal_role_on_death = table.Column<bool>(type: "boolean", nullable: false),
                    settings_seer_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    settings_vampire_count = table.Column<int>(type: "integer", nullable: false),
                    settings_voting_seconds = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_games", x => x.id);
                    table.ForeignKey(
                        name: "fk_games_users_owner_user_id",
                        column: x => x.owner_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "game_actions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    game_id = table.Column<Guid>(type: "uuid", nullable: false),
                    round = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    actor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_game_actions", x => x.id);
                    table.ForeignKey(
                        name: "fk_game_actions_games_game_id",
                        column: x => x.game_id,
                        principalTable: "games",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "game_events",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    game_id = table.Column<Guid>(type: "uuid", nullable: false),
                    round = table.Column<int>(type: "integer", nullable: false),
                    phase = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    visible_to_player_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_game_events", x => x.id);
                    table.ForeignKey(
                        name: "fk_game_events_games_game_id",
                        column: x => x.game_id,
                        principalTable: "games",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "game_players",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    game_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    username = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    seat = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    is_alive = table.Column<bool>(type: "boolean", nullable: false),
                    died_in_round = table.Column<int>(type: "integer", nullable: true),
                    death_cause = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_game_players", x => x.id);
                    table.ForeignKey(
                        name: "fk_game_players_games_game_id",
                        column: x => x.game_id,
                        principalTable: "games",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_game_players_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_game_actions_game_id_round_type_actor_id",
                table: "game_actions",
                columns: new[] { "game_id", "round", "type", "actor_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_game_events_game_id",
                table: "game_events",
                column: "game_id");

            migrationBuilder.CreateIndex(
                name: "ix_game_players_game_id_user_id",
                table: "game_players",
                columns: new[] { "game_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_game_players_user_id",
                table: "game_players",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_games_code",
                table: "games",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_games_owner_user_id",
                table: "games",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_games_phase_phase_ends_at",
                table: "games",
                columns: new[] { "phase", "phase_ends_at" });

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_normalized_username",
                table: "users",
                column: "normalized_username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "game_actions");

            migrationBuilder.DropTable(
                name: "game_events");

            migrationBuilder.DropTable(
                name: "game_players");

            migrationBuilder.DropTable(
                name: "games");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
