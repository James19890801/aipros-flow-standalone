<template>
  <!-- <div class="allDialogs"> -->
  <popSlots id="dlg_import" :dlg-name="`dlgImport`" :width="560" :add-class="name" :is-showline-parent="false"
    :isShowBtns="false" @dlgClose="eDlgClose">
    <template #dlgTitle>
      {{ dlgName }}
    </template>
    <template #dlgContents>

      <div>
        <div class="exportBox">
          <div class="export_tab first" :class="exportType == 'drag' ? 'active' : ''" @click="exportTab('drag')"><span
              class="po-icon po-iconfont">&#xe6ee;</span>拖动导入</div>
          <div class="export_tab three" :class="exportType == 'Markdown' ? 'active' : ''"
            @click="exportTab('Markdown')">
            <span class="po-icon po-iconfont">&#xe776;</span>Markdown
          </div>
          <div class="export_tab four" :class="exportType == 'Mermaid' ? 'active' : ''" @click="exportTab('Mermaid')">
            <span class="po-icon po-iconfont">&#xe776;</span>Mermaid
          </div>
          <!-- <div class="export_tab second" :class="exportType=='mubu' ? 'active' : ''" @click="exportTab('mubu')"><span class="po-icon po-iconfont">&#xe6ef;</span>幕布导入</div> -->
        </div>
      </div>
      <form id="share_upload_form" style="display:block;margin-top:0;"
        v-if="exportType == 'drag' || exportType == 'Markdown' || exportType == 'Mermaid'" 
        enctype="multipart/form-data">
        <div style="position:relative;">
          <div class="upload-contents" :style="{ height: exportType === 'drag' ? '360px' : '396px' }">
            <div v-if="exportType == 'drag'">
              <div class="drop-img">
                <span class="if if-import" />
                <!-- <span style="font-size:80px" class="icons"></span> -->
                <img style="width:91px;" src="/src/assets/images/import/import.png">
              </div>
              <div :class="`drop-text`">
                <span>直接拖入文件，即可上传</span>
              </div>
              <div class="btn-wrap">
                <PoButton id="import_btn" type="primary" style="width:110px;" :value="btnName" />
              </div>
            </div>
            <div class="markdown-input-bg" v-else>
              <textarea class="markdown-input" type="text" v-model="inputContent" @input="handleInput"></textarea>
              <div v-if="!inputContent" class="placeholder-text">
                将{{ exportType }}格式文本粘贴到这里<span v-if="exportType == 'Markdown'">或</span>
                <span class="upload-link" @click="handleUpload" v-if="exportType == 'Markdown'">上传文件</span>
              </div>
              <PoButton type="primary" class="creat-button" :value="exportType == 'Markdown' ? '生成思维导图' : '生成流程图'"
                :click="didClickCreatButton" />
            </div>
          </div>
          <input id="share_doc_input" class="file-upload" style="outline:none;" name="file" type="file" ref="fileInput"
            v-show="exportType === 'drag'"
            accept=".xmind,.mmap,.mm,.km,.txt,.opml,.pos,.vsd,.vdx,.vsdx,.posf,.posm,.poso,.vstx,.vsx,.vtx,.vssx,.vsdm,.vssm,.vstm,.csv,.xls,.xlsx,.md">
        </div>
        <input id="sys_input" type="hidden" name="sys" value="Mac">
        <input id="type_input" type="hidden" name="type" value="vsd">
        <input id="name_input" type="hidden" name="fileName">
        <input id="team_input" type="hidden" name="teamId">
        <input id="folder_input" type="hidden" name="folder">
        <input type="hidden" name="orgId">
      </form>
      <div class="exportMubuBox" v-if="exportType == 'mubu'">
        <PoInput id="exportMubuInput" class="po-cell mubuLink" v-model.trim="mubuUrl" :data-val="mubuUrl"
          @keyup="mubuexport" placeholder="输入幕布文件的分享链接" />
        <div class="exportMubuBoxDetial">
          <div>导入步骤</div>
          <div class="exportMubu_pross_two">1.进入幕布，打开需要导入的文件，点击右上角的【分享文档】</div>
          <div class="exportMubu_pross_two">2.点击复制链接，将复制后的链接粘贴到上方输入框中，点击确定（每次仅支持一个文档链接导入）</div>
        </div>
        <div style="text-align: center;margin-top: 20px;">
          <PoButton id="importmubu_btn" type="primary" style="width:110px;margin:10px auto" value="开始导入" />
          <!-- @click="getdignyiFn"  -->
        </div>
      </div>
      <!--  -->
      <div class="des-list" v-if="exportType == 'drag'" style="resize: none; outline: none; font-size: inherit;">
        <span style="float:left;margin-top:15px;">
          目前支持导入的文件类型：
        </span>
        <span class="mindtypes p-markdown" title="*md"></span>
        <span class="mindtypes p-xmind" title="*xmind"></span>
        <span class="mindtypes p-mindmanager" title="*mmap"></span>
        <span class="mindtypes p-freemind" title="*mm"></span>
        <span class="mindtypes p-kityminder" title="*km"></span>
        <span class="mindtypes p-txt" title="*txt"></span>
        <span class="mindtypes p-opml" title="*opml"></span>
        <span class="mindtypes p-pos" title="*pos"></span>
        <span class="mindtypes p-vsdx" title="*vsdx"></span>
        <span class="mindtypes p-csv" title="*csv"></span>
      </div>
      <div style="margin-top:16px" v-if="exportType == 'Markdown' || exportType == 'Mermaid'"></div>
      <div class="des-list" style="margin-top:20px" v-if="exportType == 'mubu'">支持将以上格式的文件转成协同版文件，但它不是100%兼容</div>
    </template>
  </popSlots>
  <!-- </div> -->
</template>

<script src="./script.js"></script>
<style type="style/less" scoped>
@import url(./../../../../../../css/pc/import.less);
</style>
