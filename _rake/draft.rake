require 'fileutils'

CONFIG.update('drafts' => File.join(SOURCE, "_drafts"))

# Usage: rake draft tagline="A Title"
desc "Begin a draft in #{CONFIG['drafts']}"
task :draft do
  tagline = ENV["tagline"] || "new-post"
  slug = tagline.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
  filename = File.join(CONFIG['drafts'], "#{slug}.#{CONFIG['post_ext']}")
  if File.exists?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you what to overwrite?", ['y', 'n']) == 'n'
  end
  puts "Creating new draft: #{filename}"
  open(filename, 'w') do |draft|
    draft.puts "---"
    draft.puts "layout: post"
    draft.puts 'title: ""'
    draft.puts "tagline: \"#{tagline.gsub(/-/,' ').gsub(/\b\w/) {$&.upcase}}\""
    draft.puts 'description: ""'
    draft.puts "tags: []"
    draft.puts "---"
    draft.puts "{% include JB/setup %}"
  end
end # task :draft

# Usage rake publish draft="a-title" or rake publish tagline="A Title"
desc "Publish a draft"
task :publish do
  if ENV["draft"]
    slug = ENV["draft"]
  elsif ENV["tagline"]
    slug = ENV["tagline"].downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
  else
    slug = ""
  end
  abort("rake aborted!") if slug == ""

  src = File.join(CONFIG['drafts'], "#{slug}.#{CONFIG['post_ext']}")
  date = Time.now.strftime('%Y-%m-%d')
  des = File.join(CONFIG['posts'], "#{date}-#{slug}.#{CONFIG['post_ext']}")
  FileUtils.mv(src, des)
  puts "publish #{src} as #{des}"
end