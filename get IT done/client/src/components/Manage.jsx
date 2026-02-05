import { ProjectList } from './ProjectList'
import { CategoryList } from './CategoryList'
import { GoalList } from './GoalList'
import { TagList } from './TagList'
import './Manage.css'

export function Manage({ 
  projects,
  categories,
  goals,
  tags,
  busy,
  onUpdateProject,
  onDeleteProject,
  onCreateProject,
  onUpdateCategory,
  onDeleteCategory,
  onCreateCategory,
  onUpdateGoal,
  onDeleteGoal,
  onCreateGoal,
  onUpdateTag,
  onDeleteTag,
  onCreateTag
}) {
  return (
    <div className="manageContainer">
      <div className="manageHeader">
        <h2>Manage</h2>
        <span className="manageSubtitle">Projects, categories, goals & tags</span>
      </div>

      <div className="manageGrid">
        <ProjectList
          projects={projects}
          busy={busy}
          onUpdate={onUpdateProject}
          onDelete={onDeleteProject}
          onCreate={onCreateProject}
        />
        
        <CategoryList
          categories={categories}
          busy={busy}
          onUpdate={onUpdateCategory}
          onDelete={onDeleteCategory}
          onCreate={onCreateCategory}
        />
        
        <GoalList
          goals={goals}
          busy={busy}
          onUpdate={onUpdateGoal}
          onDelete={onDeleteGoal}
          onCreate={onCreateGoal}
        />
        
        <TagList
          tags={tags}
          busy={busy}
          onUpdate={onUpdateTag}
          onDelete={onDeleteTag}
          onCreate={onCreateTag}
        />
      </div>
    </div>
  )
}
