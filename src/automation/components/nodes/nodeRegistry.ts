import TriggerNode from './TriggerNode';
import WaitNode from './WaitNode';
import ConditionNode from './ConditionNode';
import EmailNode from './EmailNode';
import UpdateStatusNode from './UpdateStatusNode';
import AddTagNode from './AddTagNode';
import WebhookNode from './WebhookNode';
import EndNode from './EndNode';

// Registry maps React Flow node type strings to components
export const nodeTypes = {
  trigger:       TriggerNode,
  wait:          WaitNode,
  condition:     ConditionNode,
  email:         EmailNode,
  update_status: UpdateStatusNode,
  add_tag:       AddTagNode,
  webhook:       WebhookNode,
  end:           EndNode,
} as const;
