#!/usr/bin/env bash
#
# Migration des images locales (appointment-backend/uploads/) vers le bucket Cloudflare R2.
#
# Prérequis :
#   - aws cli installé (https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
#   - Variables R2_* renseignées (dans le .env ou l'environnement) :
#       R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME
#
# Usage :
#   ./scripts/migrate-uploads-to-r2.sh                  # dry-run (ne change rien)
#   ./scripts/migrate-uploads-to-r2.sh --execute        # migre réellement les fichiers
#   ./scripts/migrate-uploads-to-r2.sh --delete-local   # supprime les fichiers locaux après migration
#   ./scripts/migrate-uploads-to-r2.sh --source <dir>   # autre dossier source (défaut: appointment-backend/uploads)
#
set -euo pipefail

# ─── Chargement du .env si présent ───────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${PROJECT_ROOT}/.env" ]]; then
  echo "📄 Chargement des variables depuis ${PROJECT_ROOT}/.env"
  set -a
  # tr -d '\r' : protège contre les fins de ligne CRLF (éditeurs Windows)
  # shellcheck disable=SC1091
  source <(tr -d '\r' < "${PROJECT_ROOT}/.env")
  set +a
fi

# ─── Options ─────────────────────────────────────────────────────────────────
EXECUTE=0
DELETE_LOCAL=0
SOURCE_DIR="${PROJECT_ROOT}/appointment-backend/uploads"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute)     EXECUTE=1 ;;
    --delete-local) DELETE_LOCAL=1 ;;
    --source)      SOURCE_DIR="$2"; shift ;;
    --help|-h)
      sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "❌ Option inconnue: $1 (voir --help)" >&2; exit 1 ;;
  esac
  shift
done

# ─── Vérifications ───────────────────────────────────────────────────────────
command -v aws >/dev/null 2>&1 || {
  echo "❌ 'aws' CLI est requis. Installez-le puis réessayez." >&2
  echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" >&2
  exit 1
}

[[ -n "${R2_ACCESS_KEY_ID:-}" ]]     || { echo "❌ R2_ACCESS_KEY_ID manquante" >&2; exit 1; }
[[ -n "${R2_SECRET_ACCESS_KEY:-}" ]] || { echo "❌ R2_SECRET_ACCESS_KEY manquante" >&2; exit 1; }
[[ -n "${R2_ENDPOINT:-}" ]]          || { echo "❌ R2_ENDPOINT manquant" >&2; exit 1; }
[[ -n "${R2_BUCKET_NAME:-}" ]]       || { echo "❌ R2_BUCKET_NAME manquant" >&2; exit 1; }

[[ -d "${SOURCE_DIR}" ]] || { echo "❌ Dossier source introuvable: ${SOURCE_DIR}" >&2; exit 1; }

# ─── Export des credentials pour aws cli ─────────────────────────────────────
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${R2_REGION:-auto}"
export AWS_EC2_METADATA_DISABLED=true   # évite toute tentative d'aller chercher des credentials IMDS

# ─── Résumé ──────────────────────────────────────────────────────────────────
FILE_COUNT="$(find "${SOURCE_DIR}" -type f | wc -l | tr -d ' ')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Migration des uploads vers Cloudflare R2"
echo "   Source : ${SOURCE_DIR} (${FILE_COUNT} fichier(s))"
echo "   Bucket : s3://${R2_BUCKET_NAME}/"
echo "   Endpoint : ${R2_ENDPOINT}"
if [[ "${EXECUTE}" -eq 1 ]]; then
  echo "   Mode   : ✅ EXÉCUTION RÉELLE"
else
  echo "   Mode   : 👀 dry-run (ajoutez --execute pour migrer)"
fi
if [[ "${DELETE_LOCAL}" -eq 1 ]]; then
  echo "   Suppression locale : ⚠️  activée (fichiers supprimés après upload)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "${FILE_COUNT}" -eq 0 ]]; then
  echo "ℹ️  Aucun fichier à migrer. Rien à faire."
  exit 0
fi

# ─── Commande aws s3 sync ────────────────────────────────────────────────────
# Les fichiers locaux uploads/{folder}/{file} deviennent les clés R2 {folder}/{file},
# ce qui correspond exactement à la structure d'URL renvoyée par FileStorageServiceImpl.
SYNC_ARGS=(sync "${SOURCE_DIR}/" "s3://${R2_BUCKET_NAME}/"
  --endpoint-url "${R2_ENDPOINT}"
  --no-progress)

if [[ "${EXECUTE}" -eq 0 ]]; then
  SYNC_ARGS+=(--dryrun)
fi

echo "🚀 Exécution : aws s3 ${SYNC_ARGS[*]}"
aws "${SYNC_ARGS[@]}"

# ─── Suppression des fichiers locaux (optionnelle) ───────────────────────────
if [[ "${DELETE_LOCAL}" -eq 1 ]] && [[ "${EXECUTE}" -eq 1 ]]; then
  echo "🗑️  Suppression des fichiers locaux migrés..."
  find "${SOURCE_DIR}" -type f -delete
  # Nettoie les dossiers désormais vides
  find "${SOURCE_DIR}" -type d -empty -delete 2>/dev/null || true
  echo "✅ Fichiers locaux supprimés."
fi

echo "✅ Terminé."
