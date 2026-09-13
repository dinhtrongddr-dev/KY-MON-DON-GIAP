import {steps,finish} from './shared.mjs';
import {normalizeAction,ACTIONS} from './actionRules.mjs';
// This mode consumes analysis. Only the orchestration layer calls the shared core.
export function timing(a,{action='general'}={}) {
  action=normalizeAction(action);const targets=ACTIONS[action].roles;
  return finish('timing',a,steps('timing',[
    ['goal','Mục tiêu và khoảng chọn',['self','event'],'Giữ cùng mục tiêu, múi giờ và pháp khi so sánh.'],
    ['criteria','Tiêu chí đối chiếu',['self',...targets],'Đối chiếu Không, Môn bức, từng can kích hình / nhập mộ và dấu hiệu hợp việc.'],
    ['compare','So sánh nhiều thời điểm',['self',...targets],'Dùng đúng các bàn ứng viên trong comparison; không trộn cung giữa hai thời điểm.'],
    ['choose','Lựa chọn có điều kiện',['self',...targets],'Nêu nhóm tương đương và điều kiện thực tế để chọn, không ép một thời điểm thành tuyệt đối tốt.'],
    ['limit','Giới hạn ứng kỳ',['event'],'Chọn thời điểm hành động khác với dự báo ngày có kết quả.'],
  ]),{action,targets,requiresMultipleBoards:true});
}
