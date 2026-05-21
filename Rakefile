require 'time'


desc "Compacta todos os arquivos para gerar uma versão"
task :zip do
  versao = Time.now.strftime("%Y.%-m.%-d.%-H%M")
  sh %Q(zip -r guarabira-educa.#{versao}.zip manifest.json educa.js icon*.png)
  puts "NOTE: Lembrar de atualizar versão em manifest.json: #{versao}"
end

task :default => [:zip]

rule '.svg' => ['.dot'] do |t|
  sh "dot -Tsvg #{t.name.ext('.dot')} > #{t.name}"
end
