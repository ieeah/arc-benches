import { getCategoryIconPath as engineGetCategoryIconPath } from '@/engine/maps';

export {
  MACRO_GROUPS,
  getCategoryMacroGroup,
  groupQuestPoisByQuest,
  isPriorityPoi,
  isMajorNameplate,
  clusterPoisByGrid,
  type MacroGroupId,
  type MacroGroupConfig,
  type QuestStepInfo,
  type QuestGroupInfo,
  type PoiCluster,
  type ClusterResult,
} from '@/engine/maps';

export function getCategoryIconPath(
  category: string,
  baseUrl: string = import.meta.env.BASE_URL || '/',
): string | null {
  return engineGetCategoryIconPath(category, baseUrl);
}
